import moment from 'moment'
import {Record} from 'immutable'

import {
  MESSAGE_TAG_REX,
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

  get hasSpoilerText() {
    return this.spoiler_text.length > 0
  }

  get spoilerText() {
    return this.spoiler_text
  }

  canReblog() {
    return (this.visibility === VISIBLITY_PUBLIC || this.visibility === VISIBLITY_UNLISTED)
      ? true
      : false
  }

  /**
   * そいつあてのMentionが含まれているか？
   * @param {Int} accountId そいつ
   * @return {bool}
   */
  isMentionToId(accountId) {
    return this.mentions.find((m) => m.id === accountId) ? true : false
  }

  static compareCreatedAt(a, b) {
    const aAt = a.created_at
    const bAt = b.created_at
    if(aAt < bAt)
      return 1
    else if(aAt > bAt)
      return -1
    return 0
  }

  // naumanni用機能
  get messageBlockInfo() {
    const match = this.content.match(MESSAGE_TAG_REX)
    if(!match)
      return null

    return {
      checksum: match[1],
      index: +match[2],
      total: +match[3],
    }
  }
}
