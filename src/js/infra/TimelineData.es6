/**
 * Status, Accountの最新情報を保持する。
 */


class TimelineData {
  constructor() {
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
        const {changed, merged} = this.statuses.get(uri).merge(status)
        if(changed) {
          status = merged
          changes.statuses[status.uri] = status
        }
      }

      this.statuses.set(uri, status)
    })

    // console.log('mergeStatuses', changes, this.statuses.size, this.accounts.size)

    return statusUris.map((uri) => {
      return this.makeStatusRef(uri)
    })
  }

  makeAccountRef(uri) {
    const resolve = () => this.accounts.get(uri)

    return new Proxy({}, {
      get(target, key, receiver) {
        if(key === 'resolve')
          return target[key]

        const a = resolve()
        return a[key]
      },
    })
  }

  makeStatusRef(uri) {
    const self = this
    const resolve = () => this.statuses.get(uri)

    return new Proxy({resolve}, {
      get(target, key, receiver) {
        if(key === 'resolve')
          return target[key]

        const s = resolve()
        if(key === 'account') {
          return self.makeAccountRef(s[key])
        }
        if(key === 'reblog' && s[key]) {
          return self.makeStatusRef(s[key])
        }

        return s[key]
      },
    })
  }
}


const _TimelineData = new TimelineData()
export default _TimelineData


// とりえあず...
export async function postStatusManaged(token, message) {
  const {entities, result} = await token.requester.postStatus(message, {token})
  return _TimelineData.mergeStatuses(entities, [result])[0]
}
