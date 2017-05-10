import {Record} from 'immutable'
import moment from 'moment'


const NotificationRecord = Record({  // eslint-disable-line new-cap
  host: '',

  id: null,
  type: '',
  created_at: '',
  account: null,
  status: null,
})


/**
 * Mastodon's Notification
 */
export default class Notification extends NotificationRecord {
  get uri() {
    return `notification:${this.host}:${this.id}`
  }

  get createdAt() {
    return moment(this.created_at)
  }

  // どっかに纏める
  static compareCreatedAt(a, b) {
    const aAt = a.created_at
    const bAt = b.created_at
    if(aAt < bAt)
      return 1
    else if(aAt > bAt)
      return -1
    return 0
  }
}
