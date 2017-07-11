import bezierEasing from 'bezier-easing'
import {is, List, Record} from 'immutable'


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
    return function nextTick(handler) {
      setTimeout(handler, 0)
    }
  }
  throw new Error('No Available requestFrameAnimation or process.nextTick')
}())


/**
 * 2つのRecordから、指定されたKeyだけ比べる
 * @param {string[]} keys
 * @param {Record} a
 * @param {Record} b
 * @return {bool} 指定されたKeyを比べて、全て同じであればtrue
 */
export function isKeys(keys, a, b) {
  if(a === null || b === null) {
    return a === b
  }

  require('assert')((a instanceof Record) && (b instanceof Record))

  for(const key of keys) {
    if(!is(a.get(key), b.get(key))) {
      return false
    }
  }
  return true
}

/**
 * 2つのList<Record>内のRecordから、指定されたKeyだけ比べる
 * @param {string[]} keys
 * @param {List<Record>} aList
 * @param {List<Record>} bList
 * @return {bool} 指定されたKeyを比べて、全て同じであればtrue
 */
export function isKeysList(keys, aList, bList) {
  require('assert')((aList instanceof List) && (bList instanceof List))

  if(aList.size != bList.size)
    return false

  return aList.every((a, idx) => isKeys(keys, a, bList.get(idx)))
}


/**
 * TL向けに日付を比べる。つまり古いほうが下
 * @param {moment} a
 * @param {moment} b
 * @return {number}
 */
export function compareDateForTL(a, b) {
  if(a.isBefore(b))  // a < b
    return 1
  else if(a.isAfter(b))  // a > b
    return -1
  return 0
}


/**
 * Parse input text for building autosuggestion query
 * @param {string} prefix(@ or #)
 * @param {string} str
 * @param {number} caretPosition
 * @return {[number, string]} a tuple of (query start position) and (suggestion query)
 */
export function textAtCursorMatchesToken(prefix, str, caretPosition) {
  let word

  const left = str.slice(0, caretPosition).search(/\S+$/)
  const right = str.slice(caretPosition).search(/\s/)

  if(right < 0) {
    word = str.slice(left)
  } else {
    word = str.slice(left, right + caretPosition)
  }

  if(!word || word.trim().length < 2 || !word.startsWith(prefix)) {
    return [null, null]
  }

  word = word.trim().toLowerCase().slice(1)

  if(word.length > 0) {
    return [left + 1, word]
  }

  return [null, null]
}
