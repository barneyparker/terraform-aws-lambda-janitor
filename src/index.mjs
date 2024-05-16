import { Lambda } from '@aws-sdk/client-lambda'
const lambda = new Lambda()

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
    let res = await lambda.listFunctions(params)
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
    let res = await lambda.listVersionsByFunction(params)
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
    let res = await lambda.listAliases(params)
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

  await lambda.deleteFunction(params)
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
    //    //if (!aliasedVersions.includes(version)) {
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

  // Clean each function
  const cleaners = functions.map((func) => cleanFunc(func))

  // Wait for them all to complete
  await Promise.all(cleaners)

  return Promise.resolve('ok')
}