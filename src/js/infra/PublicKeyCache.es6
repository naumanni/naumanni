import {Record} from 'immutable'
import {key as openpgpKey, HKP} from 'openpgp'

import config from 'src/config'


const StoredPublicKeyRecord = Record({  // eslint-disable-line new-cap
  user: '',
  keyId: '',
  keyArmored: '',
  dateFetched: '',
})


/**
 *
 */
export /* default */class StoredPublicKey extends StoredPublicKeyRecord {
  static storeName = 'pulbic_key_cache'
  static keyPath = 'keyId'
  // static indexes = [
  //   ['host', 'host', {}],  // uniqueでも良いかも
  //   ['client_id', ['host', 'client_id'], {unique: true}],
  // ]

  /**
   * @constructor
   */
  constructor(...args) {
    super(...args)
  }

  readArmored() {
    const result = openpgpKey.readArmored(this.keyArmored)
    if(result.err) {
      throw new Error('readArmored() failed : ' + result.err.join(', '))
    }
    return result.keys
  }
}


/**
 * 公開鍵をストアしておく奴
 * これはcontrollerなのではないか?
 * controllerってなんだ?
 */
class PublicKeyCache {
  /**
   * KeyIdの配列から、Keyを得る
   * @param {string} keyId fingerprintの先頭24文字?
   * @param {string} user user name(== acct)
   * @return {openpgp.Key}
   */
  async fetchKey({keyId, user}) {
    // HKPする
    const hkp = new HKP(config.SKS_SERVER)
    const response = await hkp.lookup({keyId, query: user})
    if(!response)
      return null

    const key = openpgpKey.readArmored(response).keys[0]
    return key
  }
}


// singleton
export default new PublicKeyCache()
