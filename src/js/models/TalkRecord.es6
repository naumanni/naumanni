import {List, Record} from 'immutable'


const TalkRecordBase = Record({  // eslint-disable-line new-cap
  subject: '',
  targets: '',
  latestStatusId: '',
  latestStatusReceivedAt: '',
  lastSeenStatusId: '',
  lastSeendAt: '',
})


/**
 * OAuthでのApp登録を表すModel
 */
export default class TalkRecord extends TalkRecordBase {
  static storeName = 'talk_records'
  static keyPath = 'address'
  static indexes = [
    ['subject', ['subject', 'targetsJoiend'], {unique: true}],
  ]

  /**
   * @constructor
   */
  constructor({subject, targets, ...others}) {
    require('assert')(subject)
    require('assert')(Array.isArray(targets))
    targets = new List(targets)
    super({targets, ...others})
  }

  /**
   * @override
   */
  toJS() {
    const js = super.toJS()

    js.address = this.address
    js.targetsJoiend = this.targetsJoiend
    return js
  }

  /**
   * 一意な識別子を返す
   */
  get address() {
    return `${this.subject}::${this.targetsJoiend}`
  }

  get targetsJoiend() {
    return this.targets.join(',')
  }
}
