/* @flow */
import {COLUMN_TALK} from 'src/constants'
import {Account, OAuthToken, UIColumn} from 'src/models'
import ChangeEventEmitter from 'src/utils/EventEmitter'
import TalkListener, {TalkBlock} from './TalkListener'


export class TalkModel {
  isLoading: boolean
  me: ?Account
  members: ?{[acct: string]: Account}
  talk: ?TalkBlock[]

  constructor(
    isLoading: boolean = true,
    me: Account = undefined,
    members: {[acct: string]: Account} = {},
    talk: ?TalkBlock[] = []
  ) {
    this.isLoading = isLoading
    this.me = me
    this.members = members
    this.talk = talk
  }

  toProps() {
    return {
      isLoading: this.isLoading,
      me: this.me,
      members: this.members,
      talk: this.talk,
    }
  }
}


/**
 * TalkColumn(s)がsubscribeするTalkListenerをまとめて管理するレイヤ
 */
class TalkListenerManager extends ChangeEventEmitter {
  listeners: Map<string, TalkListener> = new Map()
  listenerRemovers: Map<string, Function> = new Map()

  // public

  onSubscribeListener(token: OAuthToken, column: UIColumn) {
    const {key, type, params: {to}} = column
    require('assert')(type === COLUMN_TALK)
    const listener = new TalkListener([to])
    this.listenerRemovers.set(
      key,
      listener.onChange(this.onChangeTalk.bind(this, key))
    )
    listener.updateToken(token)
    this.listeners.set(key, listener)

    // initial load
    this.emitChange(key)
  }

  onUnsubscribeListener(column: UIColumn) {
    const {key, type} = column
    require('assert')(type === COLUMN_TALK)

    const remover = this.listenerRemovers.get(key)
    remover && remover()

    const listener = this.listeners.get(key)
    listener && listener.close()

    this.listenerRemovers.delete(key)
    this.listeners.delete(key)
  }

  updateTokenIfNeed(token: OAuthToken, column: UIColumn) {
    const {key, type} = column
    require('assert')(type === COLUMN_TALK)
    const listener = this.listeners.get(key)
    listener && listener.updateToken(token)
  }

  // private

  /**
   * @override
   */
  emitChange(columnKey: string) {
    const listener = this.listeners.get(columnKey)

    if(listener != null) {
      const {me, members, talk} = listener
      const isLoading = listener.isLoading()
      const model = new TalkModel(isLoading, me, members, talk)

      this.emit(this.EVENT_CHANGE, columnKey, model)
    }
  }

  // cb

  onChangeTalk(columnKey: string) {
    this.emitChange(columnKey)
  }
}

export default new TalkListenerManager()
