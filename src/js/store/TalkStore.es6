import {Store} from 'almin'

import TalkState from './TalkState'

/**
 * Talk関連のストア
 */
export default class TalkStore extends Store {
  /**
   * @constructor
   */
  constructor() {
    super()

    this.state = new TalkState()

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
      talkState: this.state,
    }
  }
}
