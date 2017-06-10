import {UseCase} from 'almin'
import openpgp, {HKP} from 'openpgp'

import config from 'src/config'
import {REGEX_PGP_FINGERPRINT} from 'src/constants'


export default class GenerateKeypairUseCase extends UseCase {
  async execute(token, account) {
    console.log(account.note)
    // generate new key pair
    const userIds = [{
      name: account.acct,
      email: account.acct,
    }]

    const bits = window.crypto.webkitSubtle ? 4096 : 2048
    console.log(`generateKey ${bits}bit, no pass pharase`, userIds)
    const keypair = await openpgp.generateKey({
      userIds,
      numBits: bits,
      passphrase: '',
    })
    console.dir(keypair)

    const {fingerprint} = keypair.key.primaryKey

    // save privateKey
    localStorage.setItem(`pgp::fingerprint::${account.account}`, fingerprint)
    localStorage.setItem(`pgp::privateKey::${account.account}`, keypair.privateKeyArmored)

    // update profile
    const note = account.plainNote.replace(REGEX_PGP_FINGERPRINT, '').replace(/[\n\u21b5]+$/, '')
    await token.requester.updateCredentials({
      note: `${note}\nPGP Key Fingerprint: ${fingerprint}`,
    })

    // upload public key
    const hkp = new HKP(config.SKS_SERVER)
    await hkp.upload(keypair.publicKeyArmored)
  }
}
