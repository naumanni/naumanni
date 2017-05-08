import moment from 'moment'
import {Record} from 'immutable'

import {
  MESSAGE_TAG_REX,
  VISIBLITY_DIRECT, VISIBLITY_PRIVATE, VISIBLITY_UNLISTED, VISIBLITY_PUBLIC,
} from 'src/constants'
import {isObjectSame} from 'src/utils'


const StatusRecord = Record({  // eslint-disable-line new-cap
  id_by_host: {},
  uri: '',
  url: '',
  content: '',
  created_at: '',
  account: '',
  reblogs_count: '',
  favourites_count: '',
  sensitive: '',
  spoiler_text: '',
  visibility: '',
  media_attachments: [],
  mentions_by_host: {},
  tags: [],
  application: '',
  reblog: null,
  in_reply_to_id_by_host: {},
  in_reply_to_account_id_by_host: {},
  reblogged_by_acct: {},
  favourited_by_acct: {},
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
    if(raw.media_attachments.length) {
      const Attachment = require('./Attachment').default
      raw.media_attachments = raw.media_attachments.map((rawmedia) => new Attachment(rawmedia))
    }

    super(raw)
  }

  // とりあえず
  get hosts() {
    return Object.keys(this.id_by_host)
  }

  get id() {
    console.error('deprecated attribute')
    require('assert')(0)
  }

  getIdByHost(host) {
    return this.id_by_host[host]
  }

  getInReplyToIdByHost(host) {
    return this.in_reply_to_id_by_host[host]
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

  isRebloggedAt(acct) {
    return this.reblogged_by_acct[acct]
  }

  isFavouritedAt(acct) {
    return this.favourited_by_acct[acct]
  }

  /**
   * そいつあてのMentionが含まれているか？
   * @param {URI} uri そいつ
   * @return {bool}
   */
  isMentionToURI(uri) {
    for(const mentions of Object.values(this.mentions_by_host)) {
      if(mentions.find((m) => m.url === uri))
        return true
    }
    return false
  }

  merge(newObj) {
    let changed = false
    const merged = super.mergeDeepWith((prev, next, key) => {
      if(typeof prev === 'object') {
        if(!isObjectSame(prev, next))
          changed = true
      }
      if(prev !== next) {
        changed = true
      }
      return next
    }, newObj)

    return {changed, merged}
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
