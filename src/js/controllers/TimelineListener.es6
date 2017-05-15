import {
  EVENT_UPDATE, EVENT_NOTIFICATION,
  TIMELINE_FEDERATION, TIMELINE_LOCAL, TIMELINE_HOME, SUBJECT_MIXED,
  STREAM_HOME, STREAM_LOCAL, STREAM_FEDERATION,
  WEBSOCKET_EVENT_MESSAGE,
} from 'src/constants'
import {normalizeStatus} from 'src/api/MastodonAPISpec'
import WebsocketManager from './WebsocketManager'


export default class TimelineListener {
  constructor(timeline, db) {
    this.timeline = timeline
    this.db = db

    this.websocketRemovers = {}
  }

  clean() {
    Object.values(this.websocketRemovers).forEach((remover) => remover())
    this.websocketRemovers = {}
  }

  addListener(key, token, websocketUrl) {
    this.websocketRemovers[key] = WebsocketManager.listen(
      websocketUrl, this.onWebsocketMessage.bind(this, token)
    )
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
      if(payload.event === EVENT_UPDATE) {
        const {entities, result} = normalizeStatus(payload.payload, token.account.instance, token.acct)

        const statusRefs = this.db.mergeStatuses(entities, [result])
        const removes = this.timeline.push(statusRefs)
        this.db.decrement(removes.map((ref) => ref.uri))
      }
    }
  }
}
