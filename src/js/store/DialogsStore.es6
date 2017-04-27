import {Store} from 'almin'

import DialogsState from './DialogsState'


/**
 * ダイアログのリストを管理する
 */
export default class DialogStore extends Store {
  /**
   * @constructor
   */
  constructor() {
    super()

    this.state = new DialogsState()

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
      dialogsState: this.state,
    }
  }
}
