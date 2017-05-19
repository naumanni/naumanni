import {Store} from 'almin'

import PreferenceState from './PreferenceState'

/**
 * Naumanniのユーザー設定を保存する
 */
export default class PreferenceStore extends Store {
  /**
   * @constructor
   */
  constructor() {
    super()

    this.state = new PreferenceState()

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
      preferenceState: this.state,
    }
  }
}
