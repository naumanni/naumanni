import moment from 'moment'
import {is, List, Map, Record} from 'immutable'

import {REGEX_PGP_FINGERPRINT} from 'src/constants'
import {parseMastodonHtml} from 'src/utils'


const AccountRecord = Record({  // eslint-disable-line new-cap
  id_by_host: new Map(),
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
  /**
   * @constructor
   * @param {Object} raw
   */
  constructor(raw, {isOriginal}={}) {
    super({
      ...raw,
      id_by_host: new Map(raw.id_by_host),
    })
    this.isOriginal = isOriginal
  }

  /**
   * @override
   */
  toJS() {
    const js = super.toJS()

    js.address = this.address
    return js
  }

  isEqual(other) {
    return this.acct === other.acct
  }

  /**
   * 一意な識別子を返す
   */
  get uri() {
    return this.url
  }

  get address() {
    console.warn('deprecated function: Account.address()')
    // acctは@を含んでないことが有る
    return this.account
  }

  get account() {
    console.warn('deprecated function: Account.account()')
    return this.acct
  }

  get id() {
    console.error('deprecated attribute: Account.id()')
    require('assert')(0)
  }

  /**
   * display_name || acct
   * 関数名紛らわしいぞ!!
   */
  get displayName() {
    return this.display_name || this.acct
  }

  getIdByHost(host) {
    return this.id_by_host.get(host)
  }

  get instance() {
    const t = this.acct.split('@', 2)
    if(t.length == 2)
      return t[1]
    return this.host
  }

  get safeAvatar() {
    return this.safeUrl(this.avatar)
  }

  safeUrl(url) {
    if(!url)
      return null
    if(url.startsWith('https://') || url.startsWith('http://'))
      return url
    if(!url.startsWith('/'))
      url = '/' + url
    return `https://${this.instance}${url}`
  }

  // TODO: Statusと一緒
  checkMerge(newObj) {
    if(is(this, newObj)) {
      return {isChanged: false, merged: this}
    }

    // mergeする。originalの方が優先。どっちも??であれば、next
    const merged = super.mergeDeepWith((prev, next, key) => {
      let result = next

      if(!is(prev, next)) {
        if(this.isOriginal)
          result = prev
        else if(newObj.isOriginal)
          result = next
      }
      return result
    }, newObj)
    merged.isOriginal = this.isOriginal || newObj.isOriginal
    return {isChanged: true, merged}
  }

  get createdAt() {
    return moment(this.created_at)
  }

  get parsedNote() {
    if(!this._parsedNote) {
      this._parsedNote = new List(parseMastodonHtml(this.note))
    }
    return this._parsedNote
  }

  get plainNote() {
    return this.note
      .replace('</p>', '\n\n')
      .replace('<br(\s+\/)?>', '\n')
      .replace(/<\/?[^>]+(>|$)/g, '').trim()
  }

  // privacy
  get hasPublicKey() {
    return REGEX_PGP_FINGERPRINT.test(this.note) ? true : false
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
}
