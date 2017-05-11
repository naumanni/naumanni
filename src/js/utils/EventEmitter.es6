import {EventEmitter} from 'events'


export default class ChangeEventEmitter extends EventEmitter {
  static EVENT_CHANGE = 'EVENT_CHANGE'

  /**
   * EVENT_CHANGEのリスナを登録する
   * @param {func} cb
   * @return {func} リスナの登録を削除するハンドラ
   */
  onChange(cb) {
    this.on(this.EVENT_CHANGE, cb)
    return this.removeListener.bind(this, this.EVENT_CHANGE, cb)
  }

  /**
   * @private
   */
  emitChange() {
    this.emit(this.EVENT_CHANGE, [this])
  }
}
