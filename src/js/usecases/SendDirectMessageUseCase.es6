import {UseCase} from 'almin'

import {encryptText} from 'src/controllers/PGP'
import PublicKeyCache from 'src/infra/PublicKeyCache'
import {postStatusManaged} from 'src/infra/TimelineData'
import {MASTODON_MAX_CONTENT_SIZE} from 'src/constants'
import UpdateLastTalkRecordUseCase from './UpdateLastTalkRecordUseCase'


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
   * @param {Account} self
   * @param {string} message
   * @param {Account[]} recipients
   */
  async execute({token, self, message, mediaFiles, in_reply_to_id, recipients, sensitive,
    onSendDirectMessageComplete}) {
    if(message.length >= MASTODON_MAX_CONTENT_SIZE) {
      // encryptedの場合分割して送るから、ContentSizeはもはや関係ないはずなんだけど...
      throw new Error('__TODO_ERROR_MESSAGE__')
    }

    const targets = [self].concat(recipients)
    const keyIds = []

    // 鍵を集める
    for(const target of targets) {
      console.log(target.acct, target.note)
      if(target.hasPublicKey)
        keyIds.push({keyId: target.publicKeyId, user: target.acct})
      else
        keyIds.push({user: target.acct})
    }

    const publicKeys = (await Promise.all(keyIds.map((query) => PublicKeyCache.fetchKey(query))))
      .reduce((publicKeys, storedKey, idx) => {
        publicKeys[targets[idx].acct] = storedKey
        console.log(targets[idx].acct, '->', storedKey && storedKey.primaryKey.fingerprint)
        return publicKeys
      }, {})

    let postedStatuses

    if(targets.every((t) => publicKeys[t.acct])) {
      // 全員鍵をもっているので、暗号化して送る
      postedStatuses = await this.sendEncryptedMessage({
        token, self, message, mediaFiles, in_reply_to_id, recipients, sensitive, publicKeys})
    } else {
      // 鍵もってないのがいるので、plainに送る
      postedStatuses = [(await this.sendPlainMessage(
        {token, self, message, mediaFiles, in_reply_to_id, recipients, sensitive}))]
    }

    onSendDirectMessageComplete(postedStatuses)

    // TalkRecordを更新する
    const latestStatusId = postedStatuses
      .map((s) => s.resolve().getIdByHost(token.host))
      .reduce((maxId, id) => Math.max(maxId, id), 0)

    await this.context.useCase(new UpdateLastTalkRecordUseCase())
      .execute({
        token,
        self: self.acct,
        recipients: recipients.map((r) => r.acct),
        latestStatusId,
        lastSeenStatusId: latestStatusId,
        lastTalk: {
          from: self.acct,
          message,
        },
      })
  }

  async sendPlainMessage({token, self, message, mediaFiles, in_reply_to_id, recipients, sensitive}) {
    require('assert')(message.length < MASTODON_MAX_CONTENT_SIZE)
    const status = recipients.map((r) => `@${r.acct}`).join(' ') + ' ' + message
    if(status.length >= MASTODON_MAX_CONTENT_SIZE) {
      // to入れるとサイズオーバーしてしまった...
      throw new Error('__TODO_ERROR_MESSAGE__')
    }
    return await postStatusManaged(token, {mediaFiles, message: {
      status,
      in_reply_to_id,
      sensitive,
      visibility: 'direct',
    }})
  }

  async sendEncryptedMessage({token, self, message, mediaFiles, in_reply_to_id, recipients, sensitive, publicKeys}) {
    const encryptedBlocks = await encryptText({
      content: message,
      addresses: recipients.reduce((addresses, recipient) => {
        addresses[recipient.acct] = publicKeys[recipient.acct]
        return addresses
      }, {}),
      senderPublicKey: publicKeys[self.acct],
      maxLength: MASTODON_MAX_CONTENT_SIZE,
    })

    return await Promise.all(
      encryptedBlocks.map((block, idx) => {
        const query = {message: {
          status: block,
          in_reply_to_id,
          sensitive,
          visibility: 'direct',
        }}

        // 添付ファイルは最初のTootにだけ付加
        if(idx == 0) {
          query.mediaFiles = mediaFiles
        }

        return postStatusManaged(token, query)
      })
    )
  }
}
