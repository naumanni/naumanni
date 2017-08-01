import {OAuthToken, Account, Status} from 'src/models'


const accountA = new Account({
  'id_by_host': {
    'oppai.tokyo': 1,
  },
  'username': 'shn',
  'acct': 'shn@oppai.tokyo', 'display_name': 'shn@oppai.tokyo✅', 'locked': false,
  'created_at': '2017-04-19T05:54:24.431Z', 'followers_count': 63, 'following_count': 22, 'statuses_count': 123,
  'note': '<p>ぶっちゃけ最近は尻も好きです<br />PGP Key Fingerprint: c3760e259ed09aae51d7d85e893ab07b862199c1</p>',
  'url': 'https://oppai.tokyo/@shn',
  'avatar': 'https://ot-mastodon.s3.amazonaws.com/accounts/avatars/000/000/001/original/2408e330e310f168.png',
  'avatar_static': 'https://ot-mastodon.s3.amazonaws.com/accounts/avatars/000/000/001/original/2408e330e310f168.png',
  'header': '/headers/original/missing.png',
  'header_static': '/headers/original/missing.png',
})

const accountB = new Account({
  'id_by_host': {
    'mstdn.onosendai.jp': 175,
  },
  'username': 't',
  'acct': 't@mstdn.onosendai.jp', 'display_name': 'tez600', 'locked': false, 'created_at': '2017-04-15T12:14:12.414Z',
  'followers_count': 73, 'following_count': 18, 'statuses_count': 99, 'note': '<p>シーランド公国男爵です</p>',
  'url': 'https://mstdn.onosendai.jp/@t',
  'avatar': 'https://mstdn.onosendai.jp/system/accounts/avatars/000/000/175/original/dc634ac694af464d.JPG?1492258865',
  'avatar_static': 'https://mstdn.onosendai.jp/system/accounts/avatars/000/000/175/original/dc634ac694af464d.JPG?1492258865',
  'header': 'https://mstdn.onosendai.jp/headers/original/missing.png',
  'header_static': 'https://mstdn.onosendai.jp/headers/original/missing.png',
})

const tokens = [
  new OAuthToken({host: 'oppai.tokyo'}),
  new OAuthToken({host: 'mstdn.onosendai.jp'}),
]
tokens[0].attachAccount(accountA)
tokens[1].attachAccount(accountB)


const talkAccountA = new Account({
  "id_by_host": {
    "friends.nico": 111166
  },
  "username": "glpt",
  "acct": "glpt@friends.nico",
  "display_name": "",
  "locked": false,
  "created_at": "2017-05-15T08:06:48.470Z",
  "followers_count": 6,
  "following_count": 3,
  "statuses_count": 111,
  "note": "<p></p>",
  "url": "https://friends.nico/@glpt",
  "avatar": "/avatars/original/missing.png",
  "avatar_static": "/avatars/original/missing.png",
  "header": "/headers/original/missing.png",
  "header_static": "/headers/original/missing.png",
})

const talkAccountB = new Account({
  "id_by_host": {
    "friends.nico": 118091
  },
  "username": "glpt",
  "acct": "glpt@pawoo.net",
  "display_name": "",
  "locked": false,
  "created_at": "2017-05-24T08:02:12.948Z",
  "followers_count": 1,
  "following_count": 1,
  "statuses_count": 13,
  "note": "",
  "url": "https://pawoo.net/@glpt",
  "avatar": "/avatars/original/missing.png",
  "avatar_static": "/avatars/original/missing.png",
  "header": "/headers/original/missing.png",
  "header_static": "/headers/original/missing.png",
})

const talkStatusA1 = new Status({
  "id_by_host": {
    "friends.nico": 12085081
  },
  "uri": "tag:friends.nico,2017-05-24:objectId=12085081:objectType=Status",
  "url": "https://friends.nico/@glpt/12085081",
  "content": "<p><span class=\"h-card\"><a href=\"https://pawoo.net/@glpt\" class=\"u-url mention\">@<span>glpt</span></a></span> hello</p>",
  "created_at": "2017-05-24T08:02:12.793Z",
  "account": "https://friends.nico/@glpt",
  "reblogs_count": 0,
  "favourites_count": 0,
  "sensitive": false,
  "spoiler_text": "",
  "visibility": "direct",
  "media_attachments": [],
  "mentions": [
    {
      "url": "https://pawoo.net/@glpt",
      "username": "glpt",
      "acct": "glpt@pawoo.net"
    }
  ],
  "tags": [],
  "application": {
    "name": "Web",
    "website": null
  },
  "reblog": null,
  "in_reply_to_id_by_host": {
    "friends.nico": null
  },
  "in_reply_to_account_id_by_host": {
    "friends.nico": null
  },
  "reblogged_by_acct": {
    "glpt@friends.nico": null
  },
  "favourited_by_acct": {
    "glpt@friends.nico": null
  },
  "fetched_at": null,
  "extended": {
    "spamfilter": {
      "uri": "tag:pawoo.net,2017-07-20:objectId=28596694:objectType=Status",
      "bad_score": 0.0487540855661885,
      "good_score": 0.6730215525955345,
      "is_spam": false
    }
  }
})

const talkStatusB1 = new Status({
  "id_by_host": {
    "friends.nico": 12085217
  },
  "uri": "tag:pawoo.net,2017-05-24:objectId=14809002:objectType=Status",
  "url": "https://pawoo.net/users/glpt/updates/3459869",
  "content": "<p><span class=\"h-card\"><a href=\"https://friends.nico/@glpt\" class=\"u-url mention\" rel=\"nofollow noopener\" target=\"_blank\">@<span>glpt</span></a></span> hi</p>",
  "created_at": "2017-05-24T08:03:14.000Z",
  "account": "https://pawoo.net/@glpt",
  "reblogs_count": 0,
  "favourites_count": 0,
  "sensitive": false,
  "spoiler_text": "",
  "visibility": "direct",
  "media_attachments": [],
  "mentions": [
    {
      "url": "https://friends.nico/@glpt",
      "username": "glpt",
      "acct": "glpt@friends.nico"
    }
  ],
  "tags": [],
  "application": {
    "name": "",
    "website": ""
  },
  "reblog": null,
  "in_reply_to_id_by_host": {
    "friends.nico": 12085081
  },
  "in_reply_to_account_id_by_host": {
    "friends.nico": 111166
  },
  "reblogged_by_acct": {
    "glpt@friends.nico": null
  },
  "favourited_by_acct": {
    "glpt@friends.nico": null
  },
  "fetched_at": null,
  "extended": {
    "spamfilter": {
      "uri": "tag:friends.nico,2017-07-07:objectId=22304475:objectType=Status",
      "bad_score": 0.060070705579230194,
      "good_score": 0.645602665605006,
      "is_spam": false
    }
  }
})

const talkStatusB2 = new Status({
  "id_by_host": {
    "friends.nico": 24872372
  },
  "uri": "tag:pawoo.net,2017-07-20:objectId=28596694:objectType=Status",
  "url": "https://pawoo.net/users/glpt/updates/5651123",
  "content": "<p><span class=\"h-card\"><a href=\"https://friends.nico/@glpt\" class=\"u-url mention\" rel=\"nofollow noopener\" target=\"_blank\">@<span>glpt</span></a></span> hello</p>",
  "created_at": "2017-07-20T07:32:14.000Z",
  "account": "https://pawoo.net/@glpt",
  "reblogs_count": 0,
  "favourites_count": 0,
  "sensitive": false,
  "spoiler_text": "",
  "visibility": "direct",
  "media_attachments": [],
  "mentions": [
    {
      "url": "https://friends.nico/@glpt",
      "username": "glpt",
      "acct": "glpt@friends.nico"
    }
  ],
  "tags": [],
  "application": {
    "name": "",
    "website": ""
  },
  "reblog": null,
  "in_reply_to_id_by_host": {
    "friends.nico": 24860155
  },
  "in_reply_to_account_id_by_host": {
    "friends.nico": 111166
  },
  "reblogged_by_acct": {
    "glpt@friends.nico": null
  },
  "favourited_by_acct": {
    "glpt@friends.nico": null
  },
  "fetched_at": null,
  "extended": {
    "spamfilter": {
      "uri": "tag:pawoo.net,2017-07-20:objectId=28596694:objectType=Status",
      "bad_score": 0.0487540855661885,
      "good_score": 0.6730215525955345,
      "is_spam": false
    }
  }
})

const talkStatusA2 = new Status({
  "id_by_host": {
    "friends.nico": 26301599
  },
  "uri": "tag:friends.nico,2017-07-28:objectId=26301599:objectType=Status",
  "url": "https://friends.nico/@glpt/26301599",
  "content": "<p><span class=\"h-card\"><a href=\"https://pawoo.net/@glpt\" class=\"u-url mention\">@<span>glpt</span></a></span> <a href=\"https://friends.nico/tags/naumanni\" class=\"mention hashtag\" rel=\"tag\">#<span>naumanni</span></a></p>",
  "created_at": "2017-07-28T09:04:53.204Z",
  "account": "https://friends.nico/@glpt",
  "reblogs_count": 0,
  "favourites_count": 0,
  "sensitive": false,
  "spoiler_text": "",
  "visibility": "direct",
  "media_attachments": [],
  "mentions": [
    {
      "url": "https://pawoo.net/@glpt",
      "username": "glpt",
      "acct": "glpt@pawoo.net"
    }
  ],
  "tags": [
    {
      "name": "naumanni"
    }
  ],
  "application": {
    "name": "naumanni",
    "website": "http://naumanniskine.localdev:7654/"
  },
  "reblog": null,
  "in_reply_to_id_by_host": {
    "friends.nico": 24872372
  },
  "in_reply_to_account_id_by_host": {
    "friends.nico": 118091
  },
  "reblogged_by_acct": {
    "glpt@friends.nico": null
  },
  "favourited_by_acct": {
    "glpt@friends.nico": null
  },
  "fetched_at": null,
  "extended": {
    "spamfilter": {
      "uri": "tag:friends.nico,2017-07-28:objectId=26301599:objectType=Status",
      "bad_score": 0.018715448355090925,
      "good_score": 0.6372358162660757,
      "is_spam": false
    }
  }
})

export {
  accountA, accountB, tokens,
  talkAccountA, talkAccountB,
  talkStatusA1, talkStatusB1, talkStatusB2, talkStatusA2,
}
