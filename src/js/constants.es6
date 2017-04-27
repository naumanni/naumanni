export const REGEX_PGP_FINGERPRINT = /PGP Key Fingerprint: ([0-9a-fA-F]+)/

export const COLUMN_TIMELINE = 'timeline'
export const COLUMN_FRIENDS = 'friends'
export const COLUMN_TALK = 'talk'

export const TIMELINE_FEDERATION = 'federation'
export const TIMELINE_LOCAL = 'local'
export const TIMELINE_HOME = 'home'

// MIXEDの方が良いかも
export const COMPOUND_TIMELINE = '__COMPOUND_TIMELINE__'   // Symbolだとjsonizeできないのでダメ

export const VISIBLITY_DIRECT = 'direct'
export const VISIBLITY_PRIVATE = 'private'
export const VISIBLITY_UNLISTED = 'unlisted'
export const VISIBLITY_PUBLIC = 'public'
