import {EventEmitter} from 'events'

import {
  COLUMN_USER, EVENT_NOTIFICATION, STREAM_HOME, SUBJECT_MIXED, WEBSOCKET_EVENT_MESSAGE,
} from 'src/constants'
import {makeWebsocketUrl} from 'src/utils'
import TimelineData from 'src/infra/TimelineData'
import WebsocketManager from './WebsocketManager'


export default class NotificationListener extends EventEmitter {
  static EVENT_CHANGE = 'EVENT_CHANGE'

  constructor(subject) {
    super()

    this.timeline = null
    this.subject = subject

    this.tokens = {}
    this.websocketRemovers = {}
  }

  // TODO: 共通化する
  updateTokens(tokens) {
    if(this.subject !== SUBJECT_MIXED) {
      // Accountタイムラインなので、一致するアカウントのみ
      tokens = tokens.filter((token) => token.acct === this.subject)
    }
    tokens = tokens.reduce((map, token) => {
      map[token.acct] = token
      return map
    }, {})

    // new tokens
    Object.values(tokens)
      .filter((newToken) => !this.tokens[newToken.acct] || !this.tokens[newToken.acct].isEqual(newToken))
      .forEach((token) => {
        if(this.tokens[token.acct]) {
          // token updated
          require('assert')(0, 'not implemented')
        } else {
          // token added
          this.onTokenAdded(token)
        }
      })

    // disposed tokens
    Object.values(this.tokens)
      .filter((oldToken) => !tokens[oldToken.acct] || !tokens[oldToken.acct].isEqual(oldToken))
      .forEach((token) => {
        if(tokens[token.acct]) {
          // token updated
          require('assert')(0, 'not implemented')
        } else {
          // token removed
          console.log(`token removed ${token.toString()}`)
          this.onTokenRemoved(token)
        }
      })

    this.tokens = tokens
  }

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
   * 新しいTokenが追加された(アカウントが追加された)
   * @param {OAuthToken} token 新しいToken
   * @private
   */
  onTokenAdded(token) {
    // user websocketをlistenする
    const websocketUrl = makeWebsocketUrl(token, STREAM_HOME)

    this.websocketRemovers[token.acct] = WebsocketManager.listen(
      websocketUrl, this.onWebsocketMessage.bind(this, token)
    )

    // とりあえずTimelineをとってくる べた書き
    token.requester.listNotifications({}, {token})
      .then(({entities, result}) => {
        const notificationRefs = TimelineData.mergeNotifications(entities, result)
        this.pushNotifications(notificationRefs)
      })
  }

  /**
   * Tokenが削除された(アカウントが削除された)
   * @param {OAuthToken} token 削除されたToken
   * @private
   */
  onTokenRemoved(token) {
    // websocketをunlistenする
    if(this.websocketRemovers[token.acct]) {
      this.websocketRemovers[token.acct]()
      delete this.websocketRemovers[token.acct]
    }
  }

  /**
   * Websocketに何かあったら呼ばれる
   * @param {OAuthToken} token
   * @param {String} type
   * @param {Object} payload
   * @private
   */
  onWebsocketMessage(token, {type, payload}) {
    if(type === WEBSOCKET_EVENT_MESSAGE) {
      if(payload.event === EVENT_NOTIFICATION) {
        const {host, acct} = token
        const {normalizeNotification} = require('src/api/MastodonAPISpec')
        const {entities, result} = normalizeNotification(payload.payload, host, acct)

        const notificationRefs = TimelineData.mergeNotifications(entities, [result])
        this.pushNotifications(notificationRefs)
      }
    }
  }

  /**
   * NotificationをTimelineに追加する
   * @param {NotificationRef[]} notificationRefs
   * @private
   */
  pushNotifications(notificationRefs) {
    // remove exists
    if(this.timeline)
      notificationRefs = notificationRefs
        .filter((x) => !this.timeline.find((old) => old.uri === x.uri))

    this.timeline = notificationRefs
      .concat(this.timeline || [])
      .sort(Notification.compareCreatedAt)
    // とりま100件に制限
    this.timeline.splice(100)

    this.emitChange()
  }

  /**
   * @private
   */
  emitChange() {
    this.emit(this.EVENT_CHANGE, [this])
  }
}
