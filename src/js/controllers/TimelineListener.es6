import {EventEmitter} from 'events'

import {
  EVENT_UPDATE, EVENT_NOTIFICATION,
  TIMELINE_FEDERATION, TIMELINE_LOCAL, TIMELINE_HOME, SUBJECT_MIXED,
  STREAM_HOME, STREAM_LOCAL, STREAM_FEDERATION,
  WEBSOCKET_EVENT_MESSAGE,
} from 'src/constants'
import {makeWebsocketUrl} from 'src/utils'
import {Status} from 'src/models'
import TimelineData from 'src/infra/TimelineData'
import WebsocketManager from './WebsocketManager'

export class TimelineEntry {
  constructor(status) {
    this.status = status
  }

  static compare(a, b) {
    const aAt = a.status.created_at
    const bAt = b.status.created_at
    if(aAt < bAt)
      return 1
    else if(aAt > bAt)
      return -1
    return 0
  }

  static compareReversed(a, b) {
    return -TimelineEntry.compare(a, b)
  }
}


export default class TimelineListener extends EventEmitter {
  static EVENT_CHANGE = 'EVENT_CHANGE'

  constructor(subject, timelineType) {
    super()

    this.timeline = []
    this.subject = subject
    this.timelineType = timelineType

    this.tokens = {}
    this.websocketRemovers = {}
    // this.timelineFetchers = {}
  }

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
          console.log(`token added ${token.toString()}`)
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
    // websocketをlistenする
    const websocketUrl = makeWebsocketUrlByTimelineType(this.timelineType, token)

    this.websocketRemovers[token.acct] = WebsocketManager.listen(
      websocketUrl, this.onWebsocketMessage.bind(this, token)
    )

    // とりあえずTimelineをとってくる
    const fetcher = makeFetcherByTimelineType(this.timelineType, token)
    // Statusの内部データの管理のために、fetcherのoptionにtokenを渡す必要がある。
    fetcher({token}).then(({entities, result}) => {
      const statusRefs = TimelineData.mergeStatuses(entities, result)
      this.pushStatuses(statusRefs)
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

    // TODO: remove all statuses for this token
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
        const {normalizeStatus} = require('src/api/MastodonAPISpec')
        const {entities, result} = normalizeStatus(payload.payload, token.account.instance, token.acct)

        const statusRefs = TimelineData.mergeStatuses(entities, [result])
        this.pushStatuses(statusRefs)
      }
    }
  }

  /**
   * StatusをTimelineに追加する
   * @param {StatusRef[]} newStatusRefs
   * @private
   */
  pushStatuses(newStatusRefs) {
    require('assert')(Array.isArray(newStatusRefs))

    // remove exists
    newStatusRefs = newStatusRefs
      .filter((status) => !this.timeline.find((old) => old.uri === status.uri))

    this.timeline = newStatusRefs
      .concat(this.timeline)
      .sort(Status.compareCreatedAt)
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


function makeWebsocketUrlByTimelineType(timelineType, token) {
  let url

  switch(timelineType) {
  case TIMELINE_HOME:
    url = makeWebsocketUrl(token, STREAM_HOME)
    break

  case TIMELINE_LOCAL:
    url = makeWebsocketUrl(token, STREAM_LOCAL)
    break

  case TIMELINE_FEDERATION:
    url = makeWebsocketUrl(token, STREAM_FEDERATION)
    break
  }
  return url
}


function makeFetcherByTimelineType(timelineType, token) {
  const {requester} = token

  let fetcher
  switch(timelineType) {
  case TIMELINE_HOME:
    fetcher = requester.listHomeTimeline.bind(requester, {})
    break

  case TIMELINE_LOCAL:
    fetcher = requester.listPublicTimeline.bind(requester, {'local': 'true'})
    break

  case TIMELINE_FEDERATION:
    fetcher = requester.listPublicTimeline.bind(requester, {})
    break
  }
  return fetcher
}
