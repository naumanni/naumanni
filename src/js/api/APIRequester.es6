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
export class APIRequester {
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

    // bind api method
    Object.keys(this.specs).forEach((apiName) => {
      const spec = this.specs[apiName]
      this[apiName] = this.call.bind(this, spec.method, apiName)
    })
  }

  /**
   * API Callの実態
   * @param {string} method
   * @param {string} apiName
   * @param {object} query
   * @param {object} options
   * @return {object}
   */
  async call(method, apiName, query, options={}) {
    const {spec, req} = this._makeRequest(method, apiName, query, options)
    let responseBody = (await req).body
    if(this.hooks.response)
      responseBody = this.hooks.response(method, apiName, responseBody)
    return spec.normalize(req, responseBody, options)
  }

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
        require('assert')(val !== undefined && val !== null, 'path argument must not be null/undefined')
        delete query[p1]
        return '/' + val
      }
      return match
    })

    const fields = (spec.fields || []).reduce((fields, field) => {
      fields[field] = query[field]
      delete query[field]
      return fields
    }, {})

    let req = this._makeJsonRequest(method.toUpperCase(), endpoint)
    req = req
      .use(this.prefixer)
      .set(options.headers || {})

    if(options.onprogress) {
      req = req.on('progress', options.onprogress)
    }

    if(spec.fields) {
      require('assert')(method !== 'get')
      Object.keys(fields).forEach((key) => {
        req = req.field(key, fields[key])
      })
    } else {
      req = req[queryFunc](query || {})
    }

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
  async call(method, apiName, query, options={}) {
    if(!this.token) {
      throw new InvalidTokenError('token not set')
    }

    // tokenの期限がきれていたらextendを試みる
    if(this.token.isExpired()) {
      console.log('token is expired, try extend', this.token)
      await this.extendToken()
    }

    let {spec, req} = this._makeRequest(method, apiName, query, options)

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

    let responseBody = response.body
    if(this.hooks.response)
      responseBody = this.hooks.response(method, apiName, responseBody)
    return spec.normalize(req, responseBody, options)
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
