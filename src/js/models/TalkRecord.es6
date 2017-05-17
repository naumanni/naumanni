import {List, Record} from 'immutable'
import moment from 'moment'


const TalkRecordBase = Record({  // eslint-disable-line new-cap
  subject: '',
  targets: '',
  latestStatusId: '',
  latestStatusReceivedAt: '',
  lastSeenStatusId: '',
  lastSeenAt: '',
  lastTalk: {},
})


/**
 * OAuthでのApp登録を表すModel
 */
export default class TalkRecord extends TalkRecordBase {
  static storeName = 'talk_records'
  static keyPath = 'address'
  static indexes = [
    ['subject', 'subject', {}],
    ['recipients', ['subject', 'targetsJoiend'], {unique: true}],
  ]

  static makeAddress(subject, targets) {
    require('assert')(subject)
    require('assert')(Array.isArray(targets))
    targets = [...targets]
    targets.sort()
    return `${subject}::${targets.join(',')}`
  }

  /**
   * @constructor
   */
  constructor({subject, targets, ...others}) {
    require('assert')(subject)
    require('assert')(Array.isArray(targets))
    targets = [...targets]
    targets.sort()
    targets = new List(targets)
    super({subject, targets, ...others})
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

  get latestStatusReceivedAtMoment() {
    return moment(this.latestStatusReceivedAt)
  }

  get lastSeenAtMoment() {
    return moment(this.lastSeenAt)
  }
}
