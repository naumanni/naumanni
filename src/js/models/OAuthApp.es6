import {Record} from 'immutable'


const OAuthAppRecord = Record({  // eslint-disable-line new-cap
  host: '',
  id: '',
  redirect_uri: '',
  client_id: '',
  client_secret: '',
})


/**
 * OAuthでのApp登録を表すModel
 */
export default class OAuthApp extends OAuthAppRecord {
  static storeName = 'oauth_apps'
  static keyPath = 'address'
  static indexes = [
    ['host', 'host', {}],  // uniqueでも良いかも
    ['client_id', ['host', 'client_id'], {unique: true}],
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
    return `${this.host}::${this.id}`
  }
}
