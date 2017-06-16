import {key as openpgpKey} from 'openpgp'


class DummyPublicKeyCache {
  setDummyKeys(keys) {
    this.keys = keys
  }

  async fetchKey({keyId, user}) {
    const rawdata = this.keys[user]
    if(!rawdata)
      return null

    return openpgpKey.readArmored(rawdata).keys[0]
  }
}
module.exports = new DummyPublicKeyCache()
