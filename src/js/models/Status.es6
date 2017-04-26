import moment from 'moment'
import {Record} from 'immutable'
import {sanitizeHtml} from 'sanitize-html'


const StatusRecord = Record({  // eslint-disable-line new-cap
  host: '',

  id: '',
  uri: '',
  url: '',
  account: '',
  in_reply_to_id: '',
  in_reply_to_account_id: '',
  reblog: '',
  content: '',
  created_at: '',
  reblogs_count: '',
  favourites_count: '',
  reblogged: '',
  favourited: '',
  sensitive: '',
  spoiler_text: '',
  visibility: '',
  media_attachments: '',
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
  constructor(...args) {
    super(...args)
  }

  get accountObject() {
    const Account = require('./Account').default
    return new Account({
      host: this.host,
      ...this.account,
    })
  }

  get sanitizedContent() {
    // TODO:sanitize
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
}
