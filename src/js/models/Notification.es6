import {Record} from 'immutable'
import moment from 'moment'

import {compareDateForTL} from 'src/utils'


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
  getIdByHost(host) {
    return this.host === host ? this.id : null
  }

  get uri() {
    return `notification:${this.host}:${this.id}`
  }

  get createdAt() {
    return moment(this.created_at)
  }

  // TODO: どっかに纏める
  static compareForTimeline(a, b) {
    return compareDateForTL(a.createdAt, b.createdAt)
  }
}
