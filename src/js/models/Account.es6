import {Record} from 'immutable'


const AccountRecord = Record({  // eslint-disable-line new-cap
  host: '',

  id: null,
  username: null,
  acct: null,
  display_name: null,
  locked: null,
  created_at: null,
  followers_count: null,
  following_count: null,
  statuses_count: null,
  note: null,
  url: null,
  avatar: null,
  avatar_static: null,
  header: null,
  header_static: null,
})


/**
 * OAuthでのApp登録を表すModel
 */
export default class Account extends AccountRecord {
  static storeName = 'accounts'
  static keyPath = 'address'
  static indexes = [
    ['host', 'host', {}],
  ]

  /**
   * @constructor
   */
  constructor(...args) {
    super(...args)
  }

  /**
   * @override
   */
  toJS() {
    const js = super.toJS()

    js.address = this.address
    return js
  }

  /**
   * 一意な識別子を返す
   */
  get address() {
    return `${this.id}@${this.host}`
  }

  get account() {
    if(this.acct.indexOf('@') >= 0)
      return this.acct
    return `${this.acct}@${this.host}`
  }
}
