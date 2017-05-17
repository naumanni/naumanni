import {
  SUBJECT_MIXED,
  EVENT_NOTIFICATION, STREAM_HOME, WEBSOCKET_EVENT_MESSAGE,
  NOTIFICATION_TYPE_MENTION, VISIBLITY_DIRECT,
} from 'src/constants'
import {makeWebsocketUrl} from 'src/utils'
import TokenListener from './TokenListener'
import WebsocketManager from './WebsocketManager'
import UpdateLastTalkRecordUseCase from 'src/usecases/UpdateLastTalkRecordUseCase'


/**
 * 常時起動してブラウザ通知とかTalkとか出すやつ
 */
export default class NotificationCenter {
  constructor(context) {
    this.context = context
    this.tokenListener = new TokenListener(SUBJECT_MIXED, {
      onTokenAdded: ::this.onTokenAdded,
      onTokenRemoved: ::this.onTokenRemoved,
      onTokenUpdated: ::this.onTokenUpdated,
    })
    this.listeners = {}

    this.context.onChange(::this.onChangeConext)
    this.onChangeConext()
  }

  // callbacks
  onChangeConext() {
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

        console.log('on', notification, status, account)

        this.onNotificationReceived(token, notification, status, account)
      }
    }
  }

  onNotificationReceived(token, notification, status, account) {
    // とりあえずべた書き
    if(notification.type === NOTIFICATION_TYPE_MENTION &&
       status.visibility === VISIBLITY_DIRECT &&
       (status.mentions && status.mentions.length === 1 && status.mentions[0].acct === token.acct)) {
      // 自分宛てのDM
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
  }
}
