import {
  EVENT_NOTIFICATION, STREAM_HOME, WEBSOCKET_EVENT_MESSAGE,
} from 'src/constants'
import {makeWebsocketUrl} from 'src/utils'
import TimelineListener from './TimelineListener'


export default class NotificationListener extends TimelineListener {
  addListener(key, token) {
    const websocketUrl = makeWebsocketUrl(token, STREAM_HOME)

    super.addListener(key, token, websocketUrl)
  }

  removeListener(key) {
    if(this.websocketRemovers[key]) {
      this.websocketRemovers[key]()
      delete this.websocketRemovers[key]
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

        const notificationRefs = this.db.mergeNotifications(entities, [result])
        const removes = this.timeline.push(notificationRefs)
        this.db.dispose(removes)
      }
    }
  }
}
