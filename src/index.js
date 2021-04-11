const Lambda = require('aws-sdk/clients/lambda')
const lambda = new Lambda()

let listFunctions = async () => {
  console.log('Getting Lambda Functions')

  let loop = async (marker, acc) => {
    let params = {
      Marker: marker,
      MaxItems: 10
    }

    let res = await lambda.listFunctions(params).promise()
    let functions = res.Functions.map(x => x.FunctionArn)
    let newAcc = acc.concat(functions)

    if (res.NextMarker) {
      return await loop(res.NextMarker, newAcc)
    } else {
      return newAcc
    }
  }

  return await loop(undefined, [])
}

let listVersions = async (funcArn) => {
  let loop = async (marker, acc) => {
    let params = {
      FunctionName: funcArn,
      Marker: marker,
      MaxItems: 20
    }

    let res = await lambda.listVersionsByFunction(params).promise()
    let versions = res.Versions.map(x => x.Version).filter(x => x != "$LATEST")
    let newAcc = acc.concat(versions)

    if (res.NextMarker) {
      return loop(res.NextMarker, newAcc)
    } else {
      return newAcc
    }
  }

  return loop(undefined, [])
}

let listAliasedVersions = async (funcArn) => {
  let loop = async (marker, acc) => {
    let params = {
      FunctionName: funcArn,
      Marker: marker,
      MaxItems: 20
    }

    let res = await lambda.listAliases(params).promise()
    let versions = res.Aliases.map(x => { return { version: x.FunctionVersion, name: x.Name} })
    let newAcc = acc.concat(versions)

    if (res.NextMarker) {
      return loop(res.NextMarker, newAcc)
    } else {
      return newAcc
    }
  }

  return loop(undefined, [])
}

let deleteVersion = async (funcArn, version) => {
  let params = {
    FunctionName: funcArn,
    Qualifier: version
  }

  await lambda.deleteFunction(params).promise()
}

let cleanFunc = async (funcArn) => {
  console.log(`cleaning function: ${funcArn}`)
  let aliasedVersions = await listAliasedVersions(funcArn)

  let versions = await listVersions(funcArn)

  for (let version of versions) {
    const alias = aliasedVersions.find(elem => version === elem.version)
//    //if (!aliasedVersions.includes(version)) {
    if (!alias) {
      console.log(`deleting [${funcArn}] version [${version}]`)
      await deleteVersion(funcArn, version)
    } else {
      console.log(`keeping  [${funcArn}] version [${version}] alias [${alias.name}]`)
    }
  }
}

module.exports.handler = async (event) => {
  console.log(JSON.stringify(event))

  // Get a list of all functions in the account
  const functions = await listFunctions()

  // Clean each function
  const cleaners = []
  functions.forEach(func => {
    cleaners.push(cleanFunc(func))
  })

  // Wait for them all to complete
  await Promise.all(cleaners)

  return Promise.resolve("ok")
}