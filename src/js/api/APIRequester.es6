import {Request} from 'superagent'

import {defineError} from 'src/utils'

const METHOD_NAME_REX = /^(list|get|patch|post|put|delete|upload)(.*)$/


/**
 * Tokenが駄目だった時の例外
 */
export const InvalidTokenError = defineError('InvalidTokenError')


const ORIGINAL_URL = Symbol('ORIGINAL_URL')

/**
 * Retry可能なsuperagent.Request
 */
function RetriableRequest(...args) {
  Request.apply(this, args)
  this[ORIGINAL_URL] = this.url
}
Object.setPrototypeOf(RetriableRequest.prototype, Request.prototype)

/**
 * superagentのリクエストをリセットする
 * @param {object} req リクエスト
 * @return {object} リセットされたRequest
 */
RetriableRequest.prototype.reset = function() {
  // superagentをhackしているのでversionによっては動かなくなると思う
  delete this._callback
  delete this._endCalled
  delete this._fullfilledPromise
  delete this.xhr
  this.url = this[ORIGINAL_URL]
  // req = req._retry()
  return this
}


/**
 * 普通にAPIをリクエストするリクエスタ
 */
class APIRequester {
  /**
   * factory
   * @param {object} specs
   * @param {object} options
   * @return {APIRequester}
   */
  static create(specs, options) {
    let requester = new this(specs, options)
    return requester
  }

  /**
   * @constructor
   * @param {object} specs
   * @param {url} enndpoint
   */
  constructor(specs, {endpoint, hooks}) {
    this.endpoint = endpoint || ''
    this.prefixer = require('superagent-prefix')(this.endpoint)
    this.specs = specs
    this.hooks = hooks || {}

    // bind api methods
    Object.keys(this.specs).forEach((apiName) => {
      const spec = this.specs[apiName]
      spec.methods.forEach((method) => {
        const methodName = method !== 'raw'
          ? `${method}${apiName[0].toUpperCase() + apiName.substr(1)}`
          : apiName
        this[methodName] = this.call.bind(this, method, apiName)
      })
    })
  }

  /**
   * Proxyから呼ばれる。 API Callの実態
   * @param {string} method
   * @param {string} apiName
   * @return {object}
   */
  async call(method, apiName, ...args) {
    const {spec, req} = this._makeRequest(method, apiName, args)
    let response = await req
    let responseBody = response.body
    if(this.hooks.resonse)
      responseBody = this.hooks.response(method, apiName, responseBody)
    return spec.normalize(method, responseBody)
  }

  /**
   * 呼び出し情報から、apiと、そのリクエストオブジェクトを作る
   * @param {string} method
   * @param {string} apiName
   * @param {object} args
   * @return {object}
   */
  _makeRequest(method, apiName, args) {
    const spec = this.specs[apiName]

    if(!spec) {
      throw new Error(`spec for api ${apiName} not found`)
    }

    if(spec.methods.indexOf(method) < 0) {
      throw new Error(`unsupported method. ${method} is not supported api '${apiName}'`)
    }

    let [req, options] = this[method](spec, ...args)

    // modify req
    req = req
      .use(this.prefixer)
      .set(options.headers || {})

    return {spec, req}
  }

  /**
   * make request for caller
   * @param {string} method
   * @param {endpoint} endpoint
   * @return {superagent.request}
   */
  _makeJsonRequest(method, endpoint) {
    return (new RetriableRequest(method, endpoint)).set('Accept', 'application/json')
  }

  /**
   * list
   * @param {APISpec} spec
   * @param {object} query
   * @param {object} options
   * @return {superagent.request}
   */
  list(spec, query, options={}) {
    return [
      this._makeJsonRequest('GET', spec.endpoint).query(query || {}),
      options,
    ]
  }

  /**
   * raw
   * @param {APISpec} spec
   * @param {object} query
   * @param {object} options
   * @return {superagent.request}
   */
  raw(spec, query, options={}) {
    return [
      this._makeJsonRequest('GET', spec.endpoint).query(query || {}),
      options,
    ]
  }

  /**
   * get
   * @param {APISpec} spec
   * @param {int} id
   * @param {object} query
   * @param {object} options
   * @return {superagent.request}
   */
  get(spec, id, query, options={}) {
    return [
      this._makeJsonRequest('GET', `${spec.endpoint}${id}/`).query(query || {}),
      options,
    ]
  }

  /**
   * post
   * @param {APISpec} spec
   * @param {object} params
   * @param {object} options
   * @param {object} replacer
   * @return {superagent.request}
   */
  post(spec, params, options={}, replacer={}) {
    let endpoint = spec.endpoint
    // endpointが/auth/users/<id>/password/のように実行時に決まるような場合
    if(spec.endpointReplace) {
      Object.keys(replacer).forEach((key) => {
        endpoint = endpoint.replace(`<${key}>`, replacer[key])
      })
    }
    return [
      this._makeJsonRequest('POST', endpoint).send(params),
      options,
    ]
  }

  /**
   * 画像アップロードのためのmethod
   * @param {APISpec} spec
   * @param {int} id
   * @param {string} fieldName
   * @param {object} params
   * @param {object} options
   * @return {superagent.request}
   */
  upload(spec, id, fieldName, params, options={}) {
    return [
      this._makeJsonRequest('PATCH', `${spec.endpoint}${id}/`).field(fieldName, params.file),
      options,
    ]
  }

  /**
   * patch
   * @param {APISpec} spec
   * @param {int} id
   * @param {object} params
   * @param {object} options
   * @return {superagent.request}
   */
  patch(spec, id, params, options={}) {
    return [
      this._makeJsonRequest('PATCH', `${spec.endpoint}${id}/`).send(params),
      options,
    ]
  }

  /**
   * delete
   * @param {APISpec} spec
   * @param {int} id
   * @param {object} params
   * @param {object} options
   * @return {superagent.request}
   */
  delete(spec, id, params, options={}) {
    return [
      this._makeJsonRequest('DELETE', `${spec.endpoint}${id}/`).send(params),
      options,
    ]
  }
}
export const makeAPIRequester = ::APIRequester.create


/**
 * OAuth TokenつきでAPIをリクエストするリクエスタ
 */
class OAuthAPIRequester extends APIRequester {
  /**
   * @constructor
   * @param {object} specs
   * @param {object} options
   */
  constructor(specs, options) {
    super(specs, options)

    const {token} = options
    this.token = token
    this._extendTokenRequest = null
    this.extendTokenHandler = null
    this.onTokenUpdateFailedHandler = null
  }

  /**
   * OAuthTokenを設定する
   * @param {OAuthToken} token
   */
  setToken(token) {
    require('assert')(token && token.accessToken)
    this.token = token
  }

  /**
   * @override
   */
  async call(method, apiName, ...args) {
    if(!this.token) {
      throw new InvalidTokenError('token not set')
    }

    // tokenの期限がきれていたらextendを試みる
    if(this.token.isExpired()) {
      console.log('token is expired, try extend', this.token)
      await this.extendToken()
    }

    let {spec, req} = this._makeRequest(method, apiName, args)

    req = req.set('Authorization', `Bearer ${this.token.accessToken}`)

    // send request
    let response
    try {
      response = await req
    } catch(err) {
      // 403であればextendを試みる
      if(err.status == 403) {
        // refresh token, and retry
        await this.extendToken()

        // retry
        req = req.reset()
        req = req.set('Authorization', `Bearer ${this.token.accessToken}`)
        response = await req
      } else {
        throw err
      }
    }

    return spec.normalize(method, response.body)
  }

  /**
   * tokenを更新する
   * ref 18.2.4
   * @return {Promise} リクエストのPromise
   */
  extendToken() {
    if(!this.extendTokenHandler) {
      throw new Error('`extendTokenHandler()` not set')
    }

    // 同時に複数のRefreshが走らないように、ここで止める
    if(this._extendTokenRequest) {
      // extend中
      console.log('extending... suspend request')
      return this._extendTokenRequest
    }

    // create new request
    this._extendTokenRequest = new Promise((resolve, reject) => {
      this.extendTokenHandler(this.token)
        .then((res) => {
          // succeeded
          delete this._extendTokenRequest
          resolve()
        }, (err) => {
          // rejected
          console.log('extend failed!')
          this.onTokenUpdateFailedHandler(err)

          // this.emit(EVENT_TOKEN_UPDATE_FAILED)
          reject(err)
        })
    })
    return this._extendTokenRequest
  }
}
export const makeOAuthAPIRequester = ::OAuthAPIRequester.create
