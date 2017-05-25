const APIRequester = require.requireActual('../APIRequester')
// const APIRequester = require('../APIRequester')

APIRequester.__scenario = null
APIRequester.__setScenario = function(scenario) {
  APIRequester.__scenario = scenario
}


/**
 * Scenarioの値を返す
 */
class DummyAPIRequester extends APIRequester.APIRequester {
  /**
   * 呼び出し情報から、apiと、そのリクエストオブジェクトを作る
   * @param {string} method
   * @param {string} apiName
   * @param {object} query
   * @param {object} options
   * @return {object}
   */
  _makeRequest(method, apiName, query, options={}) {
    const spec = this.specs[apiName]
    if(!spec) {
      throw new Error(`spec for api ${apiName} not found`)
    }

    let endpoint = spec.endpoint
    const queryFunc = (method === 'patch' || method === 'post' || method === 'put')
      ? 'send'
      : 'query'

    // modify endpoint
    query = {...query}
    endpoint = endpoint.replace(/\/:([^/]+)/g, (match, p1, offset) => {
      if(query[p1]) {
        const val = query[p1]
        require('assert')(val, 'path arguments must not be null/undefined')
        delete query[p1]
        return '/' + val
      }
      return match
    })

    let params = Object.keys(query).filter((k) => query[k]).map((k) => `${k}=${query[k]}`)
    params.sort()
    const scenarioKey = `${method.toLowerCase()}:${endpoint}?${params.join('&')}`

    const req = {
      url: `http://dummy${endpoint}`,
    }

    req.then = function(resolve, reject) {
      setTimeout(() => {
        try{
          const response = APIRequester.__scenario[scenarioKey]
          if(!response) {
            console.error(`${scenarioKey} not found`)
            reject(new Error(`${scenarioKey} not found`))
          }
          resolve({header: {}, body: JSON.parse(response)})
        } catch(e) {
          reject(e)
        }
      })
    }
    req.catch = function(cb) {
      return this.then(undefined, cb)
    }

    return {spec, req}
  }
}

APIRequester.makeAPIRequester = APIRequester.makeOAuthAPIRequester = ::DummyAPIRequester.create

module.exports = APIRequester
