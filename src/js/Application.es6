/**
 * Application配下のSingletonを管理するゾイ
 */
export class Application {
  /**
   * @constructor
   */
  constructor() {
    /**
     * @type {Context}
     * @private
     */
    this._context = null
  }

  /**
   * @return {Context}
   */
  get context() {
    return this._context
  }

  /**
   * @param {Context} newContext
   */
  set context(newContext) {
    if(process.env.NODE_ENV !== 'production') {
      require('assert')(!this._context, 'do not initialize twice')
    }

    this._context = newContext
  }
}

// singleton
export default new Application()
