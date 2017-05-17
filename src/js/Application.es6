import BrowserHistory from 'src/controllers/BrowserHistory'
import NotificationCenter from 'src/controllers/NotificationCenter'
import installRoutes from './routes'


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

  setup(newContext) {
    if(process.env.NODE_ENV !== 'production') {
      require('assert')(!this._context, 'do not initialize twice')
    }

    this._context = newContext

    // history
    this.history = new BrowserHistory(this.context, false /* useHash */)
    installRoutes(this.history)

    // notification center
    this.notificationCenter = new NotificationCenter(this.context)
  }

  /**
   * @return {Context}
   */
  get context() {
    return this._context
  }
}

// singleton
export default new Application()
