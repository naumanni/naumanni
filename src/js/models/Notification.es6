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

  // TODO: どっかに纏める
  static compareCreatedAt(a, b) {
    const aAt = a.createdAt
    const bAt = b.createdAt
    if(aAt.isBefore(bAt))
      return 1
    else if(aAt.isAfter(bAt))
      return -1
    return 0
  }
}
