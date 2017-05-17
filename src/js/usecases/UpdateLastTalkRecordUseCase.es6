import {UseCase} from 'almin'
import moment from 'moment'

import {TalkRecord} from 'src/models'
import Database from 'src/infra/Database'


/**
 * DirectMessageを送る
 */
export default class UpdateLastTalkRecordUseCase extends UseCase {
  /**
   * @override
   * @param {OAuthToken} token
   * @param {Account} self
   * @param {Account[]} recipients
   * @param {number} latestStatusId
   * @param {object} lastTalk
   */
  async execute({token, self, recipients, latestStatusId, lastSeenStatusId, lastTalk}) {
    // find
    let record
    const now = moment().format()
    const update = {lastTalk}

    if(latestStatusId) {
      update.latestStatusId = latestStatusId
      update.latestStatusReceivedAt = now
    }
    if(lastSeenStatusId) {
      update.lastSeenStatusId = lastSeenStatusId
      update.lastSeenAt = now
    }

    try {
      record = await TalkRecord.query.getBy(
        'address',
        TalkRecord.makeAddress(self, recipients))
      record = record.update(update)
    } catch(e) {
      record = new TalkRecord({
        subject: self,
        targets: recipients,
        ...update,
      })
    }
    Database.save(record)
  }
}
