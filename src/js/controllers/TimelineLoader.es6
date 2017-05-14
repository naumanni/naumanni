import {
  EVENT_UPDATE, EVENT_NOTIFICATION,
  TIMELINE_FEDERATION, TIMELINE_LOCAL, TIMELINE_HOME, SUBJECT_MIXED,
  STREAM_HOME, STREAM_LOCAL, STREAM_FEDERATION,
  WEBSOCKET_EVENT_MESSAGE,
} from 'src/constants'


import {Status} from 'src/models'
import TimelineData from 'src/infra/TimelineData'


/**
 * そのうち大きく羽ばたくはず...
 */
class TimelineLoader {
  constructor(tokens, db=null) {
    this.tokens = tokens
    this.db = db || TimelineData
  }

  async loadHead() {
    const timeline = (await Promise.all(
      this.tokens.map((token) => this.loadRequest(token, {limit: 40})
    )))
      .map(({entities, result}) => this.db.mergeStatuses(entities, result))
      .reduce((timeline, statusRefs) => {
        return statusRefs
          .filter((s) => !timeline.find((old) => old.uri === s.uri))
          .concat(timeline)
      }, [])

    timeline.sort((a, b) => Status.compareCreatedAt(a.resolve(), b.resolve()))

    return timeline
  }

  loadRequest(token, query) {
    require('assert')(0, 'must implement at subclass')
  }
}


// TODO: 対象アカウントのインスタンスのTokenもってれば、そのTokenだけ使えばいい
export class AccountTimelineLoader extends TimelineLoader {
  constructor(account, ...args) {
    super(...args)
    this.account = account
  }

  loadRequest(token, query) {
    const id = this.account.getIdByHost(token.host)
    if(!id)
      return Promise.resolve({})

    return token.requester.listAccountStatuses({...query, id}, {token})
  }
}

// -----------------------------------------------------
class TimelineLoader2 {
  constructor(timeline, token, db) {
    this._timeline = timeline
    this._token = token
    this._db = db
    this._tailReached = false
  }

  isTailReached() {
    return this._tailReached
  }

  loadInitial() {
    return this._load()
  }

  loadNext() {
    if(this._tailReached)
      return Promise.resolve()

    const minStatusId = this._timeline.getMinStatusIdForHost(this._token.host)
    if(!minStatusId)
      return Promise.resolve()

    return this._load({max_id: minStatusId})
  }

  fetch(query) {
    require('assert')(0, 'not implemented')
  }

  async _load(query) {
    const {entities, result} = await this.fetch(query)

    if(!result.length) {
      this._tailReached = true
    }

    const statusRefs = this._db.mergeStatuses(entities, result)
    const removes = this._timeline.push(statusRefs)
    this._db.dispose(removes)
  }
}


class HomeTimelineLoader extends TimelineLoader2 {
  fetch(query) {
    return this._token.requester.listHomeTimeline(query, {token: this._token})
  }
}


class LocalTimelineLoader extends TimelineLoader2 {
  fetch(query) {
    return this._token.requester.listPublicTimeline({...query, 'local': 'true'}, {token: this._token})
  }
}


class FederationTimelineLoader extends TimelineLoader2 {
  fetch(query) {
    return this._token.requester.listPublicTimeline(query, {token: this._token})
  }
}


export function makeTimelineLoader(timelineType, ...args) {
  let klass
  switch(timelineType) {
  case TIMELINE_HOME:
    klass = HomeTimelineLoader
    break

  case TIMELINE_LOCAL:
    klass = LocalTimelineLoader
    break

  case TIMELINE_FEDERATION:
    klass = FederationTimelineLoader
    break
  }
  return new klass(...args)  // eslint-disable-line new-cap
}
