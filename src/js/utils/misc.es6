import bezierEasing from 'bezier-easing'


// host -> wss urlのマップ  JSで取る方法が面倒なので、増えるまでハードコーディングで
const WEBSOCKET_HOST_MAP = {
  'mstdn.jp': 'streaming.mstdn.jp',
}

// host -> favicon urlのマップ  JSで取る方法が無いのでハードコーディング
const FAVICON_HOST_MAP = {
  'pawoo.net': 'favicon.png',
}


export const easeIn = bezierEasing(0.42, 0, 1, 1)
export const easeOut = bezierEasing(0, 0, 0.58, 1)
export const easeInOut = bezierEasing(0.42, 0, 0.58, 1)

/**
 * Builtinを継承するためのユーティリティ
 * @param {func} cls
 * @return {func}
 */
function makeExtendableBuiltin(cls) {
  /**
   * Builtin拡張のための内部クラス
   */
  function ExtendableBuiltin(...args) {
    cls.apply(this, args)
  }
  ExtendableBuiltin.prototype = Object.create(cls.prototype)
  Object.setPrototypeOf(ExtendableBuiltin, cls)

  return ExtendableBuiltin
}


/**
 * 独自エラーを定義する
 * @param {String} name
 * @return {Error}
 */
export function defineError(name) {
  /**
   * Errorを拡張するためのクラス
   */
  return class extends makeExtendableBuiltin(Error) {
    /**
     * @constructor
     * @param {String} message
     */
    constructor(message, ...args) {
      super()

      this.message = message
      this.args = defineError
      this.name = name
    }
  }
}


/**
 * location.searchをparseしてMapにして返す
 * @param {String} queryString location.searchの値
 * @return {Map<String, String>}
 */
export function parseQuery(queryString) {
  let query = {}
  queryString.substr(1).split('&').forEach((part) => {
    let pos = part.indexOf('=')
    if(pos >= 0) {
      query[decodeURIComponent(part.substr(0, pos))] = decodeURIComponent(part.substr(pos + 1))
    } else {
      query[decodeURIComponent(part)] = null
    }
  })
  return query
}


/**
 * WebsocketのUrlを作る。
 * TODO: どっかに移したい
 * @param {OAuthToken} token
 * @param {string} stream
 * @return {string}
 */
export function makeWebsocketUrl(token, stream) {
  // 暫定: websocketのhostが違うことがあるのでハードコーディング
  // browserのwebsocketは301ハンドリングできないよ > @nullkal
  const host = WEBSOCKET_HOST_MAP[token.host] || token.host

  return `wss://${host}/api/v1/streaming/?access_token=${token.accessToken}&stream=${stream}`
}


/**
 * faviconのURLを生成する
 * pawoo.netが.icoじゃないので...
 * @param {string} host
 * @return {string}
 */
export function makeFaviconUrl(host) {
  const icon = FAVICON_HOST_MAP[host] || 'favicon.ico'
  return `https://${host}/${icon}`
}


/**
 * ２つのObject a, bが同じKey, Valueをもっているか見る(keyの順序は考慮しない)
 * @param {Object} a
 * @param {Object} b
 * @return {bool}
 */
export function isObjectSame(a, b) {
  if(!a && !b)
    return true
  if(!a || !b)
    return false

  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)

  if(aKeys.find((k) => bKeys.indexOf(k) < 0))
    return false
  if(bKeys.find((k) => aKeys.indexOf(k) < 0))
    return false
  if(aKeys.find((k) => a[k] !== b[k]))
    return false

  return true
}


export function niceScrollLeft(containerNode, targetX) {
  const lastTimestamp = performance.now()
  const startX = containerNode.scrollLeft
  function _step(timestamp) {
    const t = (timestamp - lastTimestamp) / 300
    containerNode.scrollLeft = startX + (targetX - startX) * easeOut(Math.min(t, 1.0))
    if(t <= 1.0) {
      requestAnimationFrame(_step)
    }
  }
  requestAnimationFrame(_step)
}


/**
 * 次の更新タイミングで関数を実行する
 * alminから拝借
 */
export const raq = (function() {
  // Browser
  if(typeof requestAnimationFrame === 'function') {
    return requestAnimationFrame
  }

  // Other
  if(typeof setTimeout === 'function') {
    return function nextTick(handler: Function) {
      setTimeout(handler, 0)
    }
  }
  throw new Error('No Available requestFrameAnimation or process.nextTick')
}())
