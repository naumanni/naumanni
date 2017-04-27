import {Store} from 'almin'

import ColumnState from './ColumnState'


const STORAGE_KEY = 'naumanni::columns'


/**
 * UIのカラムの情報をキープする
 */
export default class ColumnStore extends Store {
  /**
   * @constructor
   */
  constructor() {
    super()

    // load
    const rawdata = localStorage.getItem(STORAGE_KEY)
    if(rawdata) {
      this.state = ColumnState.fromJSON(JSON.parse(rawdata))
    } else {
      this.state = new ColumnState()
    }

    this.onDispatch((payload) => {
      const newState = this.state.reduce(payload)
      if (newState !== this.state) {
        this.state = newState
        this.save()
        this.emitChange()
      }
    })
  }

  save() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(this.state.toJSON())
    )
  }

  /**
   * @override
   */
  getState() {
    return {
      columnState: this.state,
    }
  }
}
