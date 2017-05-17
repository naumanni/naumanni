import * as actions from 'src/actions'


/**
 * とりまViewを更新させるために日付でも持っておく
 */
export default class TalkState {
  /**
   * @param {object} talkRecordUpdates
   */
  constructor(talkRecordUpdates) {
    this._talkRecordUpdates = talkRecordUpdates
  }

  reduce(payload) {
    switch(payload.type) {
    case actions.TALK_RECORD_UPDATED:
      return this.onTalkRecordUpdated(payload)
    default:
      return this
    }
  }

  onTalkRecordUpdated({record}) {
    return new TalkState({
      ...this._talkRecordUpdates,
      [record.subject]: record.latestStatusReceivedAt,
    })
  }
}
