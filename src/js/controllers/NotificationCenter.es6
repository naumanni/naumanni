import {
  SUBJECT_MIXED,
  EVENT_NOTIFICATION, STREAM_HOME, WEBSOCKET_EVENT_MESSAGE,
  NOTIFICATION_TYPE_MENTION, VISIBLITY_DIRECT,
} from 'src/constants'
import {makeWebsocketUrl} from 'src/utils'
import TokenListener from './TokenListener'
import WebsocketManager from './WebsocketManager'
import UpdateLastTalkRecordUseCase from 'src/usecases/UpdateLastTalkRecordUseCase'
import SoundDriver from 'src/controllers/SoundDriver'


/**
 * 常時起動してブラウザ通知とかTalkとか出すやつ
 */
export default class NotificationCenter {
  constructor({app, context}) {
    this.app = app
    this.context = context
    this.tokenListener = new TokenListener(SUBJECT_MIXED, {
      onTokenAdded: ::this.onTokenAdded,
      onTokenRemoved: ::this.onTokenRemoved,
      onTokenUpdated: ::this.onTokenUpdated,
    })
    this.listeners = {}

    this.context.onChange(::this.onChangeContext)
    this.onChangeContext()
  }

  // callbacks
  onChangeContext() {
    this.tokenListener.updateTokens(this.context.getState().tokenState.tokens)
  }

  onTokenAdded(newToken) {
    this.addListener(newToken)
  }

  onTokenRemoved(oldToken) {
    this.removeListener(oldToken)
  }

  onTokenUpdated(newToken, oldToken) {
    this.removeListener(oldToken)
    this.addListener(newToken)
  }

  // private
  addListener(token) {
    console.log('addListener')
    const websocketUrl = makeWebsocketUrl(token, STREAM_HOME)
    this.listeners[token.acct] = WebsocketManager.listen(
      websocketUrl, this.onWebsocketMessage.bind(this, token)
    )
  }

  removeListener(token) {
    console.log('removeListener')
    this.listeners[token.acct]()
    delete this.listeners[token.acct]
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
        // TODO: notification listenerと被ってる -> NotificationListnerをここにつなげるべき
        const {host, acct} = token
        const {normalizeNotification} = require('src/api/MastodonAPISpec')
        const {entities, result} = normalizeNotification({result: payload.payload}, host, acct)

        const notification = entities.notifications[result]
        const status = notification.status && entities.statuses[notification.status]
        const account = notification.account && entities.accounts[notification.account]

        console.log('on', notification.toJSON(), status.toJSON(), account.toJSON())

        this.onNotificationReceived(token, notification, status, account)
      }
    }
  }

  onNotificationReceived(token, notification, status, account) {
    // とりあえずべた書き
    if(notification.type === NOTIFICATION_TYPE_MENTION) {
      // Talkの並び順
      if(status.visibility === VISIBLITY_DIRECT &&
         (status.mentions && status.mentions.length === 1 && status.mentions[0].acct === token.acct)) {
        // 自分宛てのDM
        this.updateLastTalkRecord(token, notification, status, account)
      }
    }

    // ブラウザ通知とか
    this.notifyUser(token, notification, status, account)
  }

  updateLastTalkRecord(token, notification, status, account) {
    // TODO: encryptedだった時の処理
    const statusId = status.getIdByHost(token.host)
    this.context.useCase(new UpdateLastTalkRecordUseCase())
      .execute({
        token,
        self: token.acct,
        recipients: [account.acct],
        latestStatusId: statusId,
        lastTalk: {
          from: account.acct,
          message: status.content,
        },
      })
  }

  notifyUser(token, notification, status, account) {
    const acctPref = this.context.getState().preferenceState.byAcct(token.acct)
    const prefForType = acctPref.notifications[notification.type] || {}

    if(prefForType.audio)
      SoundDriver.play('notify')

    if(window.Notification && prefForType.desktop) {
      const {formatMessage: _} = this.app.intl
      const what = _({id: `notification.what.${notification.type}`}, {displayName: account.displayName})
      const title = `${token.acct}: ${what}`
      const body = (status && (status.spoiler_text.length > 0 ? status.spoiler_text : status.plainContent)) || ''

      new Notification(title, {body, icon: account.avatar, tag: notification.uri})
    }
  }
}


// こんな雑で良いのか?
if(window.Notification) {
  Notification.requestPermission()
}
