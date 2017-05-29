import {Store} from 'almin'

import TooltipState from './TooltipState'


/**
 * ツールチップのリストを管理する
 */
export default class TooltipStore extends Store {
  /**
   * @constructor
   */
  constructor() {
    super()

    this.state = new TooltipState()

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
      tooltipState: this.state,
    }
  }
}
