import {Record, Map, fromJS} from 'immutable'


const AttachmentRecord = Record({  // eslint-disable-line new-cap
  id_by_host: new Map(),
  meta: new Map(),
  type: '',
  url: '',
  url_by_host: new Map(),
  // remote_url: '',   hostによって値が違うのでomit
  preview_url: '',
  preview_url_by_host: new Map(),
  text_url: '',
})


/**
 * MastodonのMedia
 */
export default class Attachment extends AttachmentRecord {
  constructor(raw) {
    super({
      ...raw,
      meta: fromJS(raw.meta),
    })
  }
}
