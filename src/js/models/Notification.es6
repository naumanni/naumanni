import {Record} from 'immutable'


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
}
