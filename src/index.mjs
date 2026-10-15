import { Lambda } from '@aws-sdk/client-lambda'

// Lambda admin calls are aggressively rate-limited; the SDK's default 3
// attempts are not enough to drain a large backlog, so raise them and add a
// jittered backoff of our own around every call.
const lambda = new Lambda({ maxAttempts: 10 })

/**
 * @param   {number}        ms
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Whether an error is worth retrying — throttling and transient server errors.
 *
 * @param   {unknown} err
 * @returns {boolean}
 */
const isRetryable = (err) => {
  const error = /** @type {{ name?: string, message?: string, $metadata?: { httpStatusCode?: number } }} */ (err)
  const status = error?.$metadata?.httpStatusCode ?? 0
  return (
    error?.name === 'TooManyRequestsException' ||
    error?.name === 'ThrottlingException' ||
    error?.name === 'RequestLimitExceeded' ||
    status === 429 ||
    status >= 500 ||
    /rate exceeded|throttl|too many requests/i.test(String(error?.message ?? ''))
  )
}

/**
 * Retry `fn` with full-jitter exponential backoff on transient errors.
 *
 * @template T
 * @param   {() => Promise<T>}                                                fn
 * @param   {{ retries?: number, baseDelayMs?: number, maxDelayMs?: number }} [opts]
 * @returns {Promise<T>}
 */
const withRetry = async (fn, { retries = 10, baseDelayMs = 200, maxDelayMs = 30000 } = {}) => {
  let attempt = 0
  for (;;) {
    try {
      return await fn()
    } catch (err) {
      if (attempt >= retries || !isRetryable(err)) {throw err}
      const ceiling = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt)
      await sleep(Math.random() * ceiling)
      attempt += 1
    }
  }
}

/**
 * Run `fn` over `items` with at most `limit` in flight, so we do not burst the
 * Lambda admin API. Preserves order.
 *
 * @template T, R
 * @param   {T[]}                     items
 * @param   {number}                  limit
 * @param   {(item: T) => Promise<R>} fn
 * @returns {Promise<R[]>}
 */
const mapLimit = async (items, limit, fn) => {
  /** @type {R[]} */
  const results = []
  let next = 0
  /** @type {Promise<void>[]} */
  const workers = []
  /**
   * Worker loop: pull the next index until the queue is drained.
   *
   * @returns {Promise<void>}
   */
  const run = async () => {
    while (next < items.length) {
      const index = next
      next += 1
      results[index] = await fn(items[index])
    }
  }
  for (let i = 0; i < Math.min(limit, items.length); i += 1) {
    workers.push(run())
  }
  await Promise.all(workers)
  return results
}

/**
 * @typedef {object} Alias
 * @property {string} name     Alias name
 * @property {string} version  Version
 */

/**
 * Get a list of all Lambda Fucntion ARNs in the account
 *
 * @returns {Promise<string[]>} List of Lambda Function ARNs
 */
const listFunctions = async () => {
  console.log('Getting Lambda Functions')

  const functions = []

  let params = {}

  do {
    const res = await withRetry(() => lambda.listFunctions(params))
    res.Functions.forEach((x) => functions.push(x.FunctionArn))
    params.Marker = res.NextMarker
  } while (params.Marker)

  return functions
}

/**
 * Get a list of all versions of a Lambda Function
 *
 * @param   {string}            funcArn  Lambda function ARN
 * @returns {Promise<string[]>}          List of versions
 */
const listVersions = async (funcArn) => {
  const versions = []

  let params = {
    FunctionName: funcArn,
  }

  do {
    const res = await withRetry(() => lambda.listVersionsByFunction(params))
    res.Versions.forEach((x) => {
      if (x.Version != '$LATEST') {
        versions.push(x.Version)
      }
    })
    params.Marker = res.NextMarker
  } while (params.Marker)

  return versions
}

/**
 * Get a list of all Aliases for a Lambda Function
 *
 * @param   {string}           funcArn  Lambda function ARN
 * @returns {Promise<Alias[]>}          List of Aliases
 */
const listAliases = async (funcArn) => {
  const aliases = []

  let params = { FunctionName: funcArn }

  do {
    const res = await withRetry(() => lambda.listAliases(params))
    res.Aliases.forEach((alias) => {
      // add the version referenced in this alias
      aliases.push({
        name: alias.Name,
        version: alias.FunctionVersion,
      })

      // Add any versions listed in the RoutingConfig (if it is present)
      if (alias.RoutingConfig) {
        Object.keys(alias.RoutingConfig.AdditionalVersionWeights).forEach((key) => {
          aliases.push({
            name: alias.Name,
            version: key,
          })
        })
      }
    })
    params.Marker = res.NextMarker
  } while (params.Marker)
  return aliases
}

/**
 * Delete a version of a Lambda Function
 *
 * @param   {string}        funcArn  Lambda function ARN
 * @param   {string}        version  Version to delete
 * @returns {Promise<void>}
 */
const deleteVersion = async (funcArn, version) => {
  let params = {
    FunctionName: funcArn,
    Qualifier: version,
  }

  await withRetry(async () => {
    try {
      await lambda.deleteFunction(params)
    } catch (err) {
      // Already gone (deleted by a previous run or a concurrent invocation).
      if (/** @type {{ name?: string }} */ (err).name === 'ResourceNotFoundException') {return}
      throw err
    }
  })
}

/**
 * Clean a Lambda Function by deleting all versions that are not aliased
 *
 * @param   {string}        funcArn  Lambda function ARN
 * @returns {Promise<void>}
 */
const cleanFunc = async (funcArn) => {
  const aliases = await listAliases(funcArn)
  const versions = await listVersions(funcArn)

  console.log(`cleaning function: ${funcArn}`)
  console.log(`aliasedVersions: ${JSON.stringify(aliases)}`)
  console.log(`versions: ${JSON.stringify(versions)}`)

  for (let version of versions) {
    const alias = aliases.find((elem) => version === elem.version)
    if (!alias) {
      console.log(`deleting [${funcArn}] version [${version}]`)
      await deleteVersion(funcArn, version)
    } else {
      console.log(`keeping  [${funcArn}] version [${version}] alias [${alias.name}]`)
    }
  }
}

/**
 * Lmbda function handler
 *
 * @param   {object}          event  Event object
 * @returns {Promise<string>}        Result message
 */
export const handler = async (event) => {
  console.log(JSON.stringify(event))

  // Get a list of all functions in the account
  const functions = await listFunctions()

  // Clean each function, with bounded concurrency so we do not burst the
  // Lambda admin API across every function at once.
  await mapLimit(functions, 4, cleanFunc)

  return Promise.resolve('ok')
}
