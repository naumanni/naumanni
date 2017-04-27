/**
 * Dashboardのカラム
 */
export default class UIColumn {
  /**
   * @constructor
   * @param {string} type
   * @param {object} params
   */
  constructor(type, params) {
    this.type = type
    this.params = params
  }

  get key() {
    if(!this._key) {
      let keys = Object.keys(this.params)
        .sort()
        .map((key) => `${key}=${encodeURIComponent(this.params[key])}`)
        .join('=')

      this._key = `${this.type}?${keys}`
    }
    return this._key
  }

  static isEqual(a, b) {
    return a.key === b.key
  }
}
