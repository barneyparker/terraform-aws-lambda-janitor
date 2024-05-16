import { handler } from './src/index.mjs'

/**
 * Invoke lambda handler
 */
const run = async () => {
  const result = await handler({})
  console.log(result)
}

run()