import {Record} from 'immutable'
import {key as openpgpKey} from 'openpgp'

import {HKP} from 'openpgp'


const StoredPublicKeyRecord = Record({  // eslint-disable-line new-cap
  user: '',
  keyId: '',
  keyArmored: '',
  dateFetched: '',
})


/**
 * OAuthでのApp登録を表すModel
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
   * @param {Object[]} keyIds {keyId, user}の配列
   */
  async fetchKeys(keyIds) {
    // keyIdは重複していないでほしい
    require('assert')(
      (new Set(keyIds.map(({keyId}) => keyId))).length === keyIds.length
    )

    // HKPする
    const hkp = new HKP('http://sks.oppai.tokyo')
    const responses = await Promise.all(
      keyIds.map(({keyId, user}) => hkp.lookup({keyId, query: user}))
    )

    console.log(responses)
    require('assert')(0, 'not implemented yet')
  }
}


// singleton
export default new PublicKeyCache()
