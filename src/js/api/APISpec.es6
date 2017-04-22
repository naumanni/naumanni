/**
 * REST APIの定義
 */
export default class APISpec {
  /**
   * APIRequester用に、APIのマップを返す
   * @param {object[]} specs
   * @return {object}
   */
  static make(specs) {
    return Object.keys(specs).reduce((response, apiName) => {
      response[apiName] = new this(specs[apiName])
      return response
    }, {})
  }

  /**
   * @constructor
   * @param {object} spec
   */
  constructor(spec) {
    if(process.env.NODE_ENV !== 'production') {
      require('assert')(spec.endpoint, 'spec\'s endpoint is required')
    }

    if(!spec.methods) {
      spec.methods = 'list,get,post,put,patch,delete'
    }
    if(typeof spec.methods === 'string') {
      spec.methods = spec.methods.toLowerCase().split(',')
    }

    Object.assign(this, spec)
  }

  /**
   * レスポンスを整形する
   * @param {string} method
   * @param {object} responseBody
   * @return {object}
   */
  normalize(method, responseBody) {
    const {entity} = this
    if(!entity)
      return responseBody
    // methodがdeleteのときはレスポンスがnullだからconvertできない
    if (!responseBody) {
      return null
    }

    // single object
    return entity.fromObject
      ? entity.fromObject(responseBody)
      : new entity(responseBody)  // eslint-disable-line new-cap
  }
}
