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
