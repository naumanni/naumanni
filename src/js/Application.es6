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
    this._intl = null
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
    this.notificationCenter = new NotificationCenter({app: this, context: this.context})
  }

  /**
   * @return {Context}
   */
  get context() {
    return this._context
  }

  get intl() {
    return this._intl
  }

  setIntl(newIntl) {
    this._intl = newIntl
  }
}

// singleton
export default new Application()
