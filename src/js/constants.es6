// Mastodon's max message size
export const MASTODON_MAX_CONTENT_SIZE = 500

export const NAUMANNI_VERSION = `naumanni ${process.env.NAUMANNI_VERSION || 'development ver.'}`

export const REGEX_PGP_FINGERPRINT = /PGP Key Fingerprint: ([0-9a-fA-F]+)/

export const COLUMN_TIMELINE = 'timeline'
export const COLUMN_FRIENDS = 'friends'
export const COLUMN_TALK = 'talk'

export const TIMELINE_FEDERATION = 'federation'
export const TIMELINE_LOCAL = 'local'
export const TIMELINE_HOME = 'home'

export const DIALOG_ADD_ACCOUNT = 'addAccount'
export const DIALOG_AUTHORIZE_ACCOUNT = 'authorizeAccount'

export const SUBJECT_MIXED = '!!__SUBJECT_MIXED__!!'   // Symbolだとjsonizeできないのでダメ

export const VISIBLITY_DIRECT = 'direct'
export const VISIBLITY_PRIVATE = 'private'
export const VISIBLITY_UNLISTED = 'unlisted'
export const VISIBLITY_PUBLIC = 'public'

export const NOTIFICATION_TYPE_MENTION = 'mention'
export const NOTIFICATION_TYPE_REBLOG = 'reblog'
export const NOTIFICATION_TYPE_FAVOURITE = 'favourite'
export const NOTIFICATION_TYPE_FOLLOW = 'follow'

export const KEY_ENTER = 13
