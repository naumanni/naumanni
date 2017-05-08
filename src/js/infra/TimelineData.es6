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
        const {changed, merged} = this.accounts.get(uri).merge(account)
        if(changed) {
          account = merged
          changes.accounts[account.uri] = account
        }
      }

      this.accounts.set(uri, account)
    })

    Object.values(statuses || {}).forEach((status) => {
      const uri = status.uri

      if(this.statuses.has(uri)) {
        const old = this.statuses.get(uri)
        const {changed, merged} = this.statuses.get(uri).merge(status)
        if(changed) {
          status = merged
          changes.statuses[status.uri] = status
        }
      }

      this.statuses.set(uri, status)
    })

    this.emitChange(changes)

    return statusUris.map((uri) => {
      return this.makeStatusRef(uri)
    })
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

  // private
  makeAccountRef(uri) {
    const resolve = () => this.accounts.get(uri)

    return new Proxy({uri, resolve}, {
      get(target, key, receiver) {
        if(target.hasOwnProperty(key))
          return target[key]

        const a = resolve()
        return a[key]
      },
    })
  }

  makeStatusRef(uri) {
    const self = this
    const resolve = () => this.statuses.get(uri)
    const expand = () => {
      const status = resolve()
      return {
        status,
        account: self.makeAccountRef(status.account).resolve(),
        reblog: status.reblog && self.makeStatusRef(status.reblog).resolve(),
      }
    }

    return new Proxy({uri, expand, resolve}, {
      get(target, key, receiver) {
        if(target.hasOwnProperty(key))
          return target[key]

        const s = resolve()
        if(key === 'account') {
          return self.makeAccountRef(s[key])
        } else if(key === 'reblog' && s[key]) {
          return self.makeStatusRef(s[key])
        }

        return s[key]
      },
    })
  }

  /**
   * @private
   */
  emitChange(changes) {
    this.emit(this.EVENT_CHANGE, changes)
  }
}


const _TimelineData = new TimelineData()
export default _TimelineData


// とりえあず...
export async function postStatusManaged(token, message) {
  const {entities, result} = await token.requester.postStatus(message, {token})
  return _TimelineData.mergeStatuses(entities, [result])[0]
}
