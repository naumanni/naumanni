// Mastodon's max message size
export const MASTODON_MAX_CONTENT_SIZE = 500

export const NAUMANNI_VERSION = `${process.env.NAUMANNI_VERSION || 'development'}`

export const REGEX_PGP_FINGERPRINT = /PGP Key Fingerprint: ([0-9a-fA-F]+)/

export const COLUMN_TIMELINE = 'timeline'
export const COLUMN_FRIENDS = 'friends'
export const COLUMN_TALK = 'talk'
export const COLUMN_NOTIFICATIONS = 'notifications'
export const COLUMN_TAG = 'hashtag'

export const TIMELINE_FEDERATION = 'federation'
export const TIMELINE_LOCAL = 'local'
export const TIMELINE_HOME = 'home'

export const TIMELINE_FILTER_BOOST = 'timeline_filter_boost'
export const TIMELINE_FILTER_REPLY = 'timeline_filter_reply'
export const TIMELINE_FILTER_REGEX = 'timeline_filter_regex'

export const DIALOG_ADD_ACCOUNT = 'addAccount'
export const DIALOG_AUTHORIZE_ACCOUNT = 'authorizeAccount'
export const DIALOG_MEDIA_VIEWER = 'mediaViewer'
export const DIALOG_GLOBAL_PREFERENCES = 'preferences'
export const DIALOG_USER_DETAIL = 'userDetail'
export const DIALOG_WELCOME = 'welcome'

export const DRAG_SOURCE_COLUMN = 'Column'

export const SUBJECT_MIXED = '!!__SUBJECT_MIXED__!!'   // Symbolだとjsonizeできないのでダメ

export const VISIBLITY_DIRECT = 'direct'
export const VISIBLITY_PRIVATE = 'private'
export const VISIBLITY_UNLISTED = 'unlisted'
export const VISIBLITY_PUBLIC = 'public'

export const NOTIFICATION_TYPE_MENTION = 'mention'
export const NOTIFICATION_TYPE_REBLOG = 'reblog'
export const NOTIFICATION_TYPE_FAVOURITE = 'favourite'
export const NOTIFICATION_TYPE_FOLLOW = 'follow'

export const KEY_TAB = 9
export const KEY_ENTER = 13  // 0x0D
export const KEY_ESC = 27    // 0x1B
export const KEY_ARROW_UP = 38
export const KEY_ARROW_DOWN = 40

export const ACCT_PATTERN = '[a-zA-Z0-9_]+@[a-zA-Z0-9\.\-]+[a-zA-Z0-9]+'
export const ACCT_REX = new RegExp(ACCT_PATTERN)
export const MESSAGE_TAG_REX = /--NEM\.([0-9a-f]{8})\.(\d+)\/(\d+)--/

export const STREAM_HOME = 'user'
export const STREAM_LOCAL = 'public:local'
export const STREAM_FEDERATION = 'public'
export const STREAM_TAG = 'hashtag'

// MastodonのWebsocketから送られてくるframeのevent types
export const EVENT_UPDATE = 'update'
export const EVENT_NOTIFICATION = 'notification'

// WebsocketManagerのlistnerに送られるevent type
export const WEBSOCKET_EVENT_ERROR = 'error'
export const WEBSOCKET_EVENT_OPEN = 'open'
export const WEBSOCKET_EVENT_MESSAGE = 'message'
export const WEBSOCKET_EVENT_CLOSE = 'close'

// statusをparseしたあとのToken
export const TOKEN_TEXT = 'text'
export const TOKEN_BREAK = 'break'
export const TOKEN_URL = 'url'
export const TOKEN_MENTION = 'mention'
export const TOKEN_HASHTAG = 'hashtag'
export const TOKEN_EMOJI = 'emoji'

// 最下部からこの位置に来たら、AutoPagingを開始する
export const AUTO_PAGING_MARGIN = 300

// Timelineで普段保持するStatus数
export const MAX_STATUSES = 40

// localStorageのKey
export const STORAGE_KEY_LAST_SEND_FROM = 'naumanni::last_send_from'
export const STORAGE_KEY_PREFERENCES = 'naumanni::preferences'
export const STORAGE_KEY_TOOT_VISIBILITY = 'naumanni::toot_visibility'

export const LOCALES = Object.freeze({
  en: 'English',
  ja: '日本語',
})


// naumanniおすすめのInstance
export const NAUMANNI_PREFERRED_INSTANCES = [
  ['mastodon.social'],
  ['mastodon.cloud'],
  ['mastodon.xyz'],
  ['pawoo.net', 'https://pawoo.net/favicon.png'],
  ['mstdn.jp'],
  ['friends.nico'],
]
