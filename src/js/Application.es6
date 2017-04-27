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
    this._initialized = false
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

  pushState(state, title, path) {
    this.history.pushState(state, title, path)
  }

  replaceState(state, title, path) {
    this.history.replaceState(state, title, path)
  }
}

// singleton
export default new Application()
