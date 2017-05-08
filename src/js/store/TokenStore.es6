import {Store} from 'almin'

import TokenState from './TokenState'

/**
 * 各Mastodonのアカウント情報を格納する
 */
export default class TokenStore extends Store {
  /**
   * @constructor
   */
  constructor() {
    super()

    this.state = new TokenState()

    this.onDispatch((payload) => {
      const newState = this.state.reduce(payload)
      if (newState !== this.state) {
        this.state = newState
        this.emitChange()
      }
    })
  }

  /**
   * @override
   */
  getState() {
    return {
      tokenState: this.state,
    }
  }
}
