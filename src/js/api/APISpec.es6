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

    spec.method = spec.method.toLowerCase()
    Object.assign(this, spec)
  }

  /**
   * レスポンスを整形する
   * @param {Request} req
   * @param {object} responseBody
   * @param {object} options
   * @return {object}
   */
  normalize(req, responseBody, options) {
    return responseBody
  }
}
