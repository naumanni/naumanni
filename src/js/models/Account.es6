import {Record} from 'immutable'
import {REGEX_PGP_FINGERPRINT} from 'src/constants'

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

  get hasPublicKey() {
    return this.note.match(REGEX_PGP_FINGERPRINT) ? true : false
  }

  get publicKeyId() {
    const match = this.note.match(REGEX_PGP_FINGERPRINT)
    if(!match)
      return null
    const fingerprint = match[1]
    if(fingerprint.length != 40)
      return null
    return fingerprint.substring(24)
  }

  get privateKeyArmored() {
    return localStorage.getItem(`pgp::privateKey::${this.address}`)
  }
}
