import {
  TIMELINE_FEDERATION, TIMELINE_LOCAL, TIMELINE_HOME,
} from 'src/constants'


class TimelineLoader {
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

    const minStatusId = this._timeline.getMinIdForHost(this._token.host)
    if(!minStatusId)
      return Promise.resolve()

    return this._load({max_id: minStatusId})
  }

  fetch(query) {
    require('assert')(0, 'not implemented')
  }

  // private
  async _load(query) {
    const {entities, result} = await this.fetch(query)

    if(!result.length) {
      this._tailReached = true
    }

    this._push(entities, result)
  }

  _push(entities, result) {
    const statusRefs = this._db.mergeStatuses(entities, result)
    const removes = this._timeline.push(statusRefs)
    this._db.decrement(removes.map((ref) => ref.uri))
  }
}


export class HomeTimelineLoader extends TimelineLoader {
  fetch(query) {
    return this._token.requester.listHomeTimeline(query, {token: this._token})
  }
}


export class LocalTimelineLoader extends TimelineLoader {
  fetch(query) {
    return this._token.requester.listPublicTimeline({...query, 'local': 'true'}, {token: this._token})
  }
}


export class FederationTimelineLoader extends TimelineLoader {
  fetch(query) {
    return this._token.requester.listPublicTimeline(query, {token: this._token})
  }
}


export class AccountTimelineLoader extends TimelineLoader {
  constructor(account, ...args) {
    super(...args)
    this.account = account
  }

  fetch(query) {
    const id = this.account.getIdByHost(this._token.host)
    if(!id)
      return Promise.resolve({entities: {}, result: []})

    return this._token.requester.listAccountStatuses({...query, id}, {token: this._token})
  }
}


export class NotificationTimelineLoader extends TimelineLoader {
  fetch(query) {
    return this._token.requester.listNotifications(query, {token: this._token})
  }

  _push(entities, result) {
    const notificationRefs = this._db.mergeNotifications(entities, result)
    const removes = this._timeline.push(notificationRefs)
    this._db.decrement(removes.map((ref) => ref.uri))
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
