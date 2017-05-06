import {OAuthToken, Account} from 'src/models'


const accountA = new Account({
  'host': 'oppai.tokyo',
  "id":1,"username":"shn","acct":"shn","display_name":"shn@oppai.tokyo✅","locked":false,
  "created_at":"2017-04-19T05:54:24.431Z","followers_count":63,"following_count":22,"statuses_count":123,
  "note":"<p>ぶっちゃけ最近は尻も好きです<br />PGP Key Fingerprint: c3760e259ed09aae51d7d85e893ab07b862199c1</p>",
  "url":"https://oppai.tokyo/@shn",
  "avatar":"https://ot-mastodon.s3.amazonaws.com/accounts/avatars/000/000/001/original/2408e330e310f168.png",
  "avatar_static":"https://ot-mastodon.s3.amazonaws.com/accounts/avatars/000/000/001/original/2408e330e310f168.png",
  "header":"/headers/original/missing.png",
  "header_static":"/headers/original/missing.png"
})
const accountB = new Account({
  'host': 'mstdn.onosendai.jp',
  "id":175,"username":"t","acct":"t","display_name":"tez600","locked":false,"created_at":"2017-04-15T12:14:12.414Z","followers_count":73,"following_count":18,"statuses_count":99,"note":"<p>シーランド公国男爵です</p>","url":"https://mstdn.onosendai.jp/@t","avatar":"https://mstdn.onosendai.jp/system/accounts/avatars/000/000/175/original/dc634ac694af464d.JPG?1492258865","avatar_static":"https://mstdn.onosendai.jp/system/accounts/avatars/000/000/175/original/dc634ac694af464d.JPG?1492258865","header":"https://mstdn.onosendai.jp/headers/original/missing.png","header_static":"https://mstdn.onosendai.jp/headers/original/missing.png"
})


const tokens = [
  new OAuthToken({host: 'oppai.tokyo'}),
  new OAuthToken({host: 'mstdn.onosendai.jp'}),
]
tokens[0].account = accountA
tokens[1].account = accountB


export {tokens}


// その他テスト用に使うユーティリティ...
export function setTimeoutAsync(delay) {
  return new Promise(function(resolve, reject) {
    setTimeout(resolve, delay);
  })
}
