import {Account, Status} from 'src/models'


const accountA = new Account({
  'username': 'kyounosuke1218',
  'acct': 'kyounosuke1218@pawoo.net',
  'display_name': '塚原藍森林✅Pawoo.net垢',
  'locked': false,
  'created_at': '2017-04-14T15:45:20.289Z',
  'followers_count': 281,
  'following_count': 612,
  'statuses_count': 295,
  'oauth_authentications': [{
    'uid': '19497031',
    'provider': 'pixiv',
  }],
  'note': '<p>「同人サークルツカラジッ！」とかいう団体で番組作ってます。<br /><a href=\"https://pawoo.net/tags/%E6%9D%B1%E5%8C%97\" class=\"mention hashtag\">#<span>東北</span></a> <a href=\"https://pawoo.net/tags/%E9%9D%92%E6%A3%AE\" class=\"mention hashtag\">#<span>青森</span></a> <a href=\"https://pawoo.net/tags/%E5%B2%A9%E6%89%8B\" class=\"mention hashtag\">#<span>岩手</span></a> <a href=\"https://pawoo.net/tags/%E9%89%84%E9%81%93\" class=\"mention hashtag\">#<span>鉄道</span></a> <a href=\"https://pawoo.net/tags/%E3%82%A2%E3%83%8B%E3%83%A1\" class=\"mention hashtag\">#<span>アニメ</span></a> <a href=\"https://pawoo.net/tags/%E3%82%AC%E3%82%B8%E3%82%A7%E3%83%83%E3%83%88\" class=\"mention hashtag\">#<span>ガジェット</span></a> <a href=\"https://pawoo.net/tags/%E3%83%80%E3%83%B3%E3%82%A8%E3%83%9C\" class=\"mention hashtag\">#<span>ダンエボ</span></a> <a href=\"https://pawoo.net/tags/%E3%82%A2%E3%82%A4%E3%83%89%E3%83%AB\" class=\"mention hashtag\">#<span>アイドル</span></a> <a href=\"https://pawoo.net/tags/%E9%9F%B3%E3%82%B2%E3%83%BC\" class=\"mention hashtag\">#<span>音ゲー</span></a><br /> <a href=\"https://twitter.com/kyounosuke1218\" rel=\"nofollow noopener\" target=\"_blank\"><span class=\"invisible\">https://</span><span class=\"\">twitter.com/kyounosuke1218</span><span class=\"invisible\"></span></a><br /><a href=\"https://mstdn.jp/web/accounts/5\" rel=\"nofollow noopener\" target=\"_blank\"><span class=\"invisible\">https://</span><span class=\"\">mstdn.jp/web/accounts/5</span><span class=\"invisible\"></span></a><br /><script>alert(\"abracadabra\")</script></p>',
  'url': 'https://pawoo.net/@kyounosuke1218',
  'avatar': 'https://img.pawoo.net/accounts/avatars/000/009/229/original/932077979e1f0f59.png',
  'avatar_static': 'https://img.pawoo.net/accounts/avatars/000/009/229/original/932077979e1f0f59.png',
  'header': 'https://img.pawoo.net/accounts/headers/000/009/229/original/287c62eddef5e0f4.png',
  'header_static': 'https://img.pawoo.net/accounts/headers/000/009/229/original/287c62eddef5e0f4.png',
  'id_by_host': {
    'pawoo.net': 9229,
  },
})

const statusA = new Status({
  'id_by_host': {
    'friends.nico': 9823571,
  },
  'uri': 'tag:friends.nico,2017-05-16:objectId=9823571:objectType=Status',
  'url': 'https://friends.nico/@glpt/9823571',
  'content': '<p><span class=\"h-card\"><a href=\"https://friends.nico/@glpt2\" class=\"u-url mention\">@<span>glpt2</span></a></span> pong<br /><script>alert(\"abracadabra\")</script></p>',
  'created_at': '2017-05-16T08:50:08.188Z',
  'account': 'https://friends.nico/@glpt',
  'reblogs_count': 0,
  'favourites_count': 0,
  'sensitive': false,
  'spoiler_text': '',
  'visibility': 'direct',
  'media_attachments': [],
  'mentions': [{
    'url': 'https://friends.nico/@glpt2',
    'acct': 'glpt2@friends.nico',
    'id': 111968,
    'username': 'glpt2',
  }],
  'tags': [],
  'application': {
    'name': 'Web',
    'website': null,
  },
  'reblog': null,
  'in_reply_to_id_by_host': {
    'friends.nico': 9823456,
  },
  'in_reply_to_account_id_by_host': {
    'friends.nico': 111968,
  },
  'reblogged_by_acct': {
    'glpt@friends.nico': null,
  },
  'favourited_by_acct': {
    'glpt@friends.nico': null,
  },
})

const statusB = new Status({
    reblog: null,
    id: 24829125,
    created_at: '2017-07-20T02:19:12.554Z',
    in_reply_to_id: null,
    in_reply_to_account_id: null,
    sensitive: false,
    spoiler_text: '',
    visibility: 'unlisted',
    language: 'ja',
    application: {
      name: 'naumanni',
      website: 'http://naumanniskine.localdev:7654/'
    },
    account: {
      id: 111166,
      username: 'glpt',
      acct: 'glpt',
      display_name: '',
      locked: false,
      created_at: '2017-05-15T08:06:48.470Z',
      followers_count: 6,
      following_count: 3,
      statuses_count: 107,
      note: '<p></p>',
      url: 'https://friends.nico/@glpt',
      avatar: '/avatars/original/missing.png',
      avatar_static: '/avatars/original/missing.png',
      header: '/headers/original/missing.png',
      header_static: '/headers/original/missing.png',
      nico_url: null
    },
    media_attachments: [],
    mentions: [],
    tags: [],
    uri: 'tag:friends.nico,2017-07-20:objectId=24829125:objectType=Status',
    content: '<p>やったぜ✨🎉</p>',
    url: 'https://friends.nico/@glpt/24829125',
    reblogs_count: 0,
    favourites_count: 0,
    favourited: null,
    reblogged: null,
    muted: null,
    plainContent: 'やったぜ✨🎉',
    urls: [],
    extended: {
      spamfilter: {
        uri: 'tag:friends.nico,2017-07-20:objectId=24829125:objectType=Status',
        bad_score: 0.08223853032113487,
        good_score: 0.5017670372443336,
        is_spam: false
      }
    }
})

export {accountA, statusA, statusB}
