import {Store} from 'almin'

import AccountsState from './AccountsState'

/**
 * 各Mastodonのアカウント情報を格納する
 */
export default class AccountsStore extends Store {
  /**
   * @constructor
   */
  constructor() {
    super()

    this.state = new AccountsState()

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
      accountsState: this.state,
    }
  }
}
