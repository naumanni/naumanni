import {Record} from 'immutable'


const AttachmentRecord = Record({  // eslint-disable-line new-cap
  'id': '',
  'type': '',
  'url': '',
  'remote_url': '',
  'preview_url': '',
  'text_url': '',
})


/**
 * MastodonのMedia
 */
export default class Attachment extends AttachmentRecord {
}
