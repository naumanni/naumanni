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
  /**
   * @constructor
   * @param {object} raw
   */
  constructor(raw) {
    if(raw.account) {
      // avoid circular dependency
      const Account = require('./Account').default
      raw.account = new Account({
        host: raw.host,
        ...raw.account,
      })
    }
    if(raw.status) {
      const Status = require('./Status').default
      raw.status = new Status({
        host: raw.host,
        ...raw.status,
      })
    }

    super(raw)
  }
}
