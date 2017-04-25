import {UseCase} from 'almin'
import openpgp, {HKP} from 'openpgp'

import {REGEX_PGP_FINGERPRINT} from 'src/constants'


export default class GenerateKeypairUseCase extends UseCase {
  async execute(token, account) {
    console.log(account.note)
    // generate new key pair
    const userIds = [{
      name: account.acct.trim(),
      email: `${account.acct}@${account.host}`,
    }]
    console.log('generateKey 1024bit, no pass pharase', userIds)
    const keypair = await openpgp.generateKey({
      userIds,
      numBits: 1024,
      passphrase: '',
    })
    console.dir(keypair)
    console.log(keypair.privateKeyArmored)
    console.log(keypair.publicKeyArmored)

    const {fingerprint} = keypair.key.primaryKey

    // save privateKey
    localStorage.setItem(`pgp::fingerprint::${account.address}`, fingerprint)
    localStorage.setItem(`pgp::publicKey::${account.address}`, keypair.privateKeyArmored)

    // update profile
    const note = account.note.replace(REGEX_PGP_FINGERPRINT, '').replace(/[\n\u21b5]+$/, '')
    const response = await token.requester.updateCredentials({
      note: `${note}\nPGP Key Fingerprint: ${fingerprint}`,
    })
    console.log(response)

    const hkp = new HKP('http://sks.oppai.tokyo')
    const hkpResponse = await hkp.upload(keypair.publicKeyArmored)
    console.dir(hkpResponse)
  }
}
