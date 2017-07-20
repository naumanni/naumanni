/**
 * Status, Accountの最新情報を保持する。
 */
import {EventEmitter} from 'events'
import {Set} from 'immutable'
import {shortnameToUnicode} from 'emojione'


/**
 * Status, Accountを保持する
 * 参照カウントの管理とか面倒すぎて完全に設計が間違ってる
 */
export class TimelineData extends EventEmitter {
  static EVENT_CHANGE = 'change'

  constructor(...args) {
    super(...args)

    // uriがkeyつってんだから、accounts/statusesの区別要らないはずだよね...
    this.accounts = new Map()  // immutable.Mapじゃないから注意
    this.statuses = new Map()

    this.referenceCounts = new Map()

    this.timelines = new Set()
  }

  /**
   * Statusをマージして、TimelineDataを更新し、リファレンスだけ返す
   * @param {object} entities
   * @param {string[]} statusUris
   * @return {StatusRef[]}
   */
  mergeStatuses(entities, statusUris=[]) {
    this.mergeEntities(entities)
    this.increment(statusUris)
    return statusUris.map((uri) => new StatusRef(this, uri))
  }

  mergeNotifications(entities, notificationUris) {
    this.mergeEntities(entities)
    const notificatonRefs = notificationUris.map((uri) => new NotificationRef(this, entities.notifications[uri]))

    // TODO: NotificationTimelineと重複している
    const iter = (function* () {
      for(const ref of notificatonRefs) {
        const accountRef = ref.accountRef
        if(accountRef)
          yield accountRef.uri
        const statusRef = ref.statusRef
        if(statusRef)
          yield statusRef.uri
      }
    })()
    this.increment(iter)

    return notificatonRefs
  }

  mergeEntities({statuses, accounts}) {
    const changes = {
      statuses: {},
      accounts: {},
    }

    Object.values(accounts || {}).forEach((account) => {
      const uri = account.uri

      // こんなチェックせずに、全てchangedとして扱えばいいのでは
      if(this.accounts.has(uri)) {
        const {isChanged, merged} = this.accounts.get(uri).checkMerge(account)
        if(isChanged) {
          account = merged
          changes.accounts[account.uri] = account
        }
      }

      this.accounts.set(uri, account)
    })

    Object.values(statuses || {}).forEach((status) => {
      const uri = status.uri

      if(this.statuses.has(uri)) {
        const {isChanged, merged} = this.statuses.get(uri).checkMerge(status)

        if(isChanged) {
          status = merged
          changes.statuses[status.uri] = status
        }
      }

      this.statuses.set(uri, status)
    })

    // console.log(`+: ${this.accounts.size} accounts, ${this.statuses.size} statuses`)

    this.emitChange(changes)
    this.timelines
      .filter((timeline) => timeline.hasChanges(changes))
      .forEach((timeline) => timeline.emitChange())
  }

  registerTimeline(timeline) {
    this.timelines = this.timelines.add(timeline)
    return this.unregisterTimeline.bind(this, timeline)
  }

  unregisterTimeline(timeline) {
    this.timelines = this.timelines.delete(timeline)
  }

  /**
   * 与えられたUriの参照カウントを+1する
   * @param {String[]} uris
   */
  increment(uris) {
    this.changeRefCounts(uris, +1)
  }

  /**
   * 与えられたUriの参照カウントを-1する
   * @param {String[]} uris
   */
  decrement(uris) {
    this.changeRefCounts(uris, -1)
    this.collectGarbage()
  }

  /**
   * 参照カウンタを変える
   * @private
   * @param {String[]} uris
   * @param {number} delta
   */
  changeRefCounts(uris, delta) {
    let moreUris = []

    for(const uri of uris) {
      const status = this.statuses.get(uri)
      const account = this.accounts.get(uri)

      if(!status && !account) {
        console.warn(`changeRefCounts: '${uri}' not found`)
        continue
      }

      if(status) {
        moreUris.push(status.account)
        if(status.reblog) {
          moreUris.push(status.reblog)
        }
      } else if(account) {
        // pass
      }

      // inc
      this.referenceCounts.set(
        uri,
        (this.referenceCounts.get(uri) || 0) + delta
      )
    }

    moreUris.length && this.changeRefCounts(moreUris, delta)
  }

  collectGarbage() {
    // TODO immutablejs使いたい
    const newRefCounts = new Map()
    for(const [uri, count] of this.referenceCounts.entries()) {
      if(count === 0) {
        if(this.statuses.has(uri))
          this.statuses.delete(uri)
        if(this.accounts.has(uri))
          this.accounts.delete(uri)
      } else {
        newRefCounts.set(uri, count)
      }
    }
    this.referenceCounts = newRefCounts
    // console.log(`-: ${this.accounts.size} accounts, ${this.statuses.size} statuses`)
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
   * @param {object} changes 変更のあったデータ
   * @private
   */
  emitChange(changes) {
    this.emit(this.EVENT_CHANGE, changes)
  }
}


class DBRef {
  static store = null

  constructor(db, uri) {
    require('assert')(uri)
    this._db = db
    this._uri = uri
  }

  get uri() {
    return this._uri
  }

  resolve() {
    require('assert')(this.constructor.store)
    return this._db[this.constructor.store].get(this._uri)
  }

  expand() {
    require('assert')(0, 'not implemented')
  }
}


export class AccountRef extends DBRef {
  static store = 'accounts'

  /**
   * @override
   */
  expand() {
    const account = this.resolve()
    return {
      account,
    }
  }
}


export class StatusRef extends DBRef {
  static store = 'statuses'

  /**
   * @override
   */
  expand() {
    const status = this.resolve()
    const reblog = status.reblog && (new StatusRef(this._db, status.reblog)).resolve()
    return {
      status,
      account: (new AccountRef(this._db, status.account)).resolve(),
      reblog,
      reblogAccount: reblog && (new AccountRef(this._db, reblog.account)).resolve(),
    }
  }

  get reblogRef() {
    const status = this.resolve()
    return status.reblog ? new StatusRef(this._db, status.reblog) : null
  }

  get accountRef() {
    return new AccountRef(this._db, this.resolve().account)
  }

  get accountUri() {
    const status = this.resolve()
    if(!status) {
      console.warn('status cannnot resolved')
    }
    return status && status.account
  }
}

/**
 * Notificationの実体は無価値なので、こいつは実はDBRefではない。
 * だけど、Status, AccountのRefを保持する
 */
export class NotificationRef {
  constructor(db, notification) {
    this._db = db
    this._notification = notification
  }

  resolve() {
    return this._notification
  }

  get uri() {
    return this._notification.uri
  }

  get type() {
    return this._notification.type
  }

  get createdAt() {
    return this._notification.createdAt
  }

  get accountRef() {
    return new AccountRef(this._db, this._notification.account)
  }

  get statusRef() {
    return this._notification.status && new StatusRef(this._db, this._notification.status)
  }
}


const _TimelineData = new TimelineData()
export default _TimelineData


// TODO TimelineActionsに移す
export async function postStatusManaged(token, {mediaFiles, message}) {
  const {requester} = token

  if(mediaFiles && mediaFiles.length > 0) {
    const mediaFileResponses = await Promise.all(
      mediaFiles.map((file) => {
        return requester.createMedia({file}, {onprogress: (e) => {
          console.log('upload', e.percent)
        }})
      })
    )
    message.media_ids = mediaFileResponses.map((a) => a.result.id)
  }
  message.status = shortnameToUnicode(message.status)

  const {entities, result} = await requester.postStatus(message, {token})
  return _TimelineData.mergeStatuses(entities, [result])[0]
}
