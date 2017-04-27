/**
 * ダイアログ
 */
export default class UIDialog {
  /**
   * @constructor
   * @param {string} type
   * @param {object} params
   * @param {string} unique
   */
  constructor(type, params, unique) {
    this.type = type
    this.params = params || {}
    this.unique = '' + (unique || parseInt(new Date().getTime()))
  }

  get key() {
    if(!this._key) {
      let keys = Object.keys(this.params)
        .sort()
        .map((key) => `${key}=${encodeURIComponent(this.params[key])}`)
        .join('=')

      this._key = `${this.type}/${this.unique}?${keys}`
    }
    return this._key
  }

  static isEqual(a, b) {
    return a.key === b.key
  }
}
