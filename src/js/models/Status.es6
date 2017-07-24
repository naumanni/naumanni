import moment from 'moment'
import {is, fromJS, List, Map, Record} from 'immutable'

import {
  MESSAGE_TAG_REX,
  VISIBLITY_DIRECT, VISIBLITY_PRIVATE, VISIBLITY_UNLISTED, VISIBLITY_PUBLIC,
} from 'src/constants'
import {compareDateForTL, emojify, parseMastodonHtml, parsedHtmlToText} from 'src/utils'
import Attachment from './Attachment'


const TagRecord = Record({  // eslint-disable-line new-cap
  name: '',
  // url: new Map(),    // hostによって値が違うのでomitする
})

const MentionRecord = Record({  // eslint-disable-line new-cap
  url: '',
  username: '',
  acct: '',
  // id: 0,   // hostによって値が違うのでomitする
})

const ApplicationRecord = Record({  // eslint-disable-line new-cap
  name: '',
  website: '',
})

const StatusRecord = Record({  // eslint-disable-line new-cap
  id_by_host: new Map(),
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
  media_attachments: new List(),
  mentions: new List(),
  tags: new List(),
  application: new ApplicationRecord(),
  reblog: null,
  in_reply_to_id_by_host: new Map(),
  in_reply_to_account_id_by_host: new Map(),
  reblogged_by_acct: new Map(),
  favourited_by_acct: new Map(),

  // naumanni
  fetched_at: null,  // WebSocketから取得した日付
  extended: new Map(),  // pluginが追加する値
})

const NOT_SET = {}


/**
 * MastodonのStatus
 */
export default class Status extends StatusRecord {
  /**
   * @constructor
   * @param {object} raw
   */
  constructor(raw, {isOriginal}={}) {
    raw = {
      ...raw,
      id_by_host: new Map(raw.id_by_host),
      in_reply_to_id_by_host: new Map(raw.in_reply_to_id_by_host),
      in_reply_to_account_id_by_host: new Map(raw.in_reply_to_account_id_by_host),
      reblogged_by_acct: new Map(raw.reblogged_by_acct),
      favourited_by_acct: new Map(raw.favourited_by_acct),
      sensitive: !!raw.sensitive,
      media_attachments: new List((raw.media_attachments || []).map((obj) => new Attachment(obj))),
      tags: new List((raw.tags || []).map((obj) => new TagRecord(obj))),
      mentions: new List((raw.mentions || []).map((obj) => new MentionRecord(obj))),
      application: new ApplicationRecord(raw.application),  // TODO: Recordにする
      extended: fromJS(raw.extended || {}),
    }

    super(raw)
    this.isOriginal = isOriginal || false
  }

  // とりあえず
  get hosts() {
    return this.id_by_host.keySeq().toArray()
  }

  get id() {
    console.error('deprecated attribute')
    require('assert')(0)
  }

  getIdByHost(host) {
    return this.id_by_host.get(host)
  }

  getInReplyToIdByHost(host) {
    return this.in_reply_to_id_by_host.get(host)
  }

  get parsedContent() {
    if(!this._parsedContent) {
      const mentions = this.mentions
      const content = emojify(this.content)
      this._parsedContent = new List(parseMastodonHtml(content, mentions))
    }
    return this._parsedContent
  }

  get plainContent() {
    return parsedHtmlToText(this.parsedContent)
  }

  get createdAt() {
    if(!this._createdAt)
      this._createdAt = moment(this.created_at)
    return this._createdAt
  }

  get fetchedAt() {
    if(!this._fetchedAt)
      this._fetchedAt = this.fetched_at ? moment(this.fetched_at) : null
    return this._fetchedAt
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
    return this.reblogged_by_acct.get(acct)
  }

  isFavouritedAt(acct) {
    return this.favourited_by_acct.get(acct)
  }

  /**
   * そいつあてのMentionが含まれているか？
   * @param {URI} uri そいつ
   * @return {bool}
   */
  isMentionToURI(uri) {
    if(this.mentions.find((m) => m.url === uri))
      return true
    return false
  }

  checkMerge(newObj) {
    if(is(this, newObj)) {
      return {isChanged: false, merged: this}
    }

    // mergeする。originalの方が優先。どっちも??であれば、next
    const merged = this.withMutations((self) => {
      newObj.forEach((next, key) => {
        self.update(key, NOT_SET, (prev) => {
          let result = next

          if(key === 'fetched_at') {
            // fetched_atは一番古い日付を使う. nullだったら、WebSocket以前にもってたってことなのでnullのまま
            if(!next || (prev && next && prev < next))
              result = prev
          } else if(prev instanceof Map) {
            // mapだったらnext優先でmergeする
            result = prev.mergeDeep(next)
          } else {
            // それ以外はoriginal優先
            if(this.isOriginal)
              result = prev
            else if(newObj.isOriginal)
              result = next
          }

          return result
        })
      })
    })
    merged.isOriginal = this.isOriginal || newObj.isOriginal

    return {isChanged: true, merged}
  }

  static compareForTimeline(a, b) {
    const af = a.fetchedAt
    const bf = b.fetchedAt

    if(af && bf)
      return compareDateForTL(af, bf)
    else if(!af && bf)
      return 1
    else if(af && !bf)
      return -1
    else
      return compareDateForTL(a.createdAt, b.createdAt)
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

  getExtended(key) {
    return this.extended.get(key)
  }
}
