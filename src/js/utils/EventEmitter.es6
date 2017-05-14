import {EventEmitter} from 'events'


export default class ChangeEventEmitter extends EventEmitter {
  static EVENT_CHANGE = 'EVENT_CHANGE'

  /**
   * EVENTのリスナを登録する
   * @param {string} event
   * @param {func} cb
   * @return {func} リスナの登録を削除するハンドラ
   */
  on(event, cb) {
    super.on(event, cb)
    return this.removeListener.bind(this, this.event, cb)
  }

  /**
   * EVENT_CHANGEのリスナを登録する
   * @param {func} cb
   * @return {func} リスナの登録を削除するハンドラ
   */
  onChange(cb) {
    return this.on(this.EVENT_CHANGE, cb)
  }

  /**
   * @private
   */
  emitChange() {
    this.emit(this.EVENT_CHANGE, [this])
  }
}
