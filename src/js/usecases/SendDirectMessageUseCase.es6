import {UseCase} from 'almin'

import * as actions from 'src/actions'
// import {UIColumn} from 'src/models'

/**
 * DirectMessageを送る
 */
export default class SendDirectMessageUseCase extends UseCase {
  constructor() {
    super()
  }

  /**
   * @override
   * @param {OAuthToken} token
   * @param {string} message
   * @param {Account} target
   */
  async execute(token, message, target) {
    console.log('SendDirectMessageUseCase', token, message, target)

    const {requester} = token
    let spoilerText = null

    // 公開鍵をもっていたらメッセージを暗号化する
    if(target.hasPublicKey) {
      console.log('begin encrypt')
      const hkp = new HKP('http://sks.oppai.tokyo')
      const key = await hkp.lookup({
        query: target.acct.indexOf('@') >= 0 ? target.acct : `${target.acct}@${target.host}`,
        keyId: target.publicKeyId,
      })

      const pubkey = key && openpgpKey.readArmored(key)

      if(pubkey) {
        console.log('pubkey found', pubkey)
        [message, spoilerText] = await Promise.all([
          encryptText(pubkey, message),
          encryptText(pubkey, spoilerText),
        ])
      } else {
        console.log(`Failed to get ${target.acct}\'s public key (${target.publicKeyId})`)
      }
    }

    // send
    const response = await requester.postStatus({
      status: `@${targetAcct} ${status}`,
      spoiler_text: spoilerText,
      visibility: 'direct',
    })
    console.log(response)
  }
}
