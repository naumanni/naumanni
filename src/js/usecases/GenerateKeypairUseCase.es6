import {UseCase} from 'almin'
import openpgp, {HKP} from 'openpgp'

// import {OAuthToken} from 'src/models'
// import * as actions from 'src/actions'
const REX_PGP_FINGERPRINT = /PGP Key Fingerprint: ([0-9a-fA-F]+)/

export default class GenerateKeypairUseCase extends UseCase {
  async execute(token, account) {
    console.log(account.note)
    // generate new key pair
    const userIds = [{
      name: account.acct.trim(),
      email: `${account.acct}@${account.host}`,
    }]
    console.log('generateKey 2048bit, no pass pharase', userIds)
    const keypair = await openpgp.generateKey({
      userIds,
      numBits: 2048,
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
    const note = account.note.replace(REX_PGP_FINGERPRINT, '').replace(/[\n\u21b5]+$/, '')
    const response = await token.requester.updateCredentials({
      note: `${note}\nPGP Key Fingerprint: ${fingerprint}`,
    })
    console.log(response)

    const hkp = new HKP('http://sks.oppai.tokyo')
    const hkpResponse = await hkp.upload(keypair.publicKeyArmored)
    console.dir(hkpResponse)
  }
}
