/**
 * Status, Accountの最新情報を保持する。
 */
import {EventEmitter} from 'events'


class TimelineData extends EventEmitter {
  static EVENT_CHANGE = 'change'

  constructor(...args) {
    super(...args)

    this.accounts = new Map()
    this.statuses = new Map()
  }

  /**
   * Statusをマージして、TimelineDataを更新し、リファレンスだけ返す
   * @param {object} entities
   * @param {string[]} statusUris
   * @return {StatusRef[]}
   */
  mergeStatuses({statuses, accounts}, statusUris) {
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

    this.emitChange(changes)

    return statusUris.map((uri) => new StatusRef(this, uri))
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


class AccountRef extends DBRef {
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


class StatusRef extends DBRef {
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

  get accountRef() {
    return new AccountRef(this._db, this.resolve().account)
  }

  get accountUri() {
    return this.resolve().account
  }
}


const _TimelineData = new TimelineData()
export default _TimelineData


// とりえあず...
export async function postStatusManaged(token, {mediaFiles, message}) {
  const {requester} = token

  if(mediaFiles) {
    const mediaFileResponses = await Promise.all(
      mediaFiles.map((file) => {
        return requester.createMedia({file}, {onprogress: (e) => {
          console.log('upload', e.percent)
        }})
      })
    )

    message.media_ids = mediaFileResponses.map((a) => a.id)
  }

  const {entities, result} = await requester.postStatus(message, {token})
  return _TimelineData.mergeStatuses(entities, [result])[0]
}
