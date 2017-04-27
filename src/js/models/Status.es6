import moment from 'moment'
import {Record} from 'immutable'

import {
  VISIBLITY_DIRECT, VISIBLITY_PRIVATE, VISIBLITY_UNLISTED, VISIBLITY_PUBLIC,
} from 'src/constants'


const StatusRecord = Record({  // eslint-disable-line new-cap
  host: '',

  id: '',
  uri: '',
  url: '',
  account: null,
  in_reply_to_id: '',
  in_reply_to_account_id: '',
  reblog: null,
  content: '',
  created_at: '',
  reblogs_count: '',
  favourites_count: '',
  reblogged: '',
  favourited: '',
  sensitive: '',
  spoiler_text: '',
  visibility: '',
  media_attachments: [],
  mentions: '',
  tags: '',
  application: '',
})


/**
 * MastodonのStatus
 */
export default class Status extends StatusRecord {
  /**
   * @constructor
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
    if(raw.reblog) {
      raw.reblog = new Status({
        host: raw.host,
        ...raw.reblog,
      })
    }

    if(raw.media_attachments.length) {
      const Attachment = require('./Attachment').default
      raw.media_attachments = raw.media_attachments.map((rawmedia) => new Attachment(rawmedia))
    }

    super(raw)
  }

  get rawContent() {
    // TODO:sanitize
    // import {sanitizeHtml} from 'sanitize-html'
    return this.content
  }

  get createdAt() {
    return moment(this.created_at)
  }

  get hasEncryptedStatus() {
    if(this.content.indexOf('&lt;nem&gt;') >= 0)
      return true
    if(this.spoiler_text.indexOf('<nem>') >= 0)
      return true
    return false
  }

  canReblog() {
    return (this.visibility === VISIBLITY_PUBLIC || this.visibility === VISIBLITY_UNLISTED)
      ? true
      : false
  }
}
