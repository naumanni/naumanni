/* @flow */
import {COLUMN_FRIENDS} from 'src/constants'
import {OAuthToken, UIColumn} from 'src/models'
import ChangeEventEmitter from 'src/utils/EventEmitter'
import FriendsListener, {UIFriend} from './FriendsListener.es6'


export class FriendsModel {
  friends: UIFriend[]
  isLoading: boolean

  constructor(friends: UIFriend[] = [], isLoading: boolean = true) {
    this.friends = friends
    this.isLoading = isLoading
  }

  toProps() {
    return {
      friends: this.friends,
      isLoading: this.isLoading,
    }
  }
}


class FriendsListenerManager extends ChangeEventEmitter {
  listeners: Map<string, FriendsListener> = new Map()
  listenerRemovers: Map<string, Function> = new Map()

  onSubscribeListener(token: OAuthToken, column: UIColumn) {
    const {key, type, params: {subject}} = column
    require('assert')(type === COLUMN_FRIENDS)
    const listener = new FriendsListener(subject)
    this.listenerRemovers.set(
      key,
      listener.onChange(this.onChangeFriends.bind(this, key))
    )
    listener.open(token)
    this.listeners.set(key, listener)

    // initial load
    this.emitChange(key)
  }

  onUnsubscribeListener(column: UIColumn) {
    const {key, type} = column
    require('assert')(type === COLUMN_FRIENDS)

    const remover = this.listenerRemovers.get(key)
    remover && remover()

    this.listenerRemovers.delete(key)
    this.listeners.delete(key)
  }

  updateTokenIfNeed(token: OAuthToken, column: UIColumn) {
    const {key, type} = column
    require('assert')(type === COLUMN_FRIENDS)
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
      const {isLoading, state: {friends}} = listener
      const model = new FriendsModel(friends, isLoading)

      this.emit(this.EVENT_CHANGE, columnKey, model)
    }
  }

  onChangeFriends(columnKey: string) {
    this.emitChange(columnKey)
  }
}

export default new FriendsListenerManager()
