import {OAuthToken, Account} from 'src/models'


const accountA = new Account({
  id_by_host: {
    'oppai.tokyo': 1,
  },
  "username":"shn",
  "acct":"shn@oppai.tokyo","display_name":"shn@oppai.tokyo✅","locked":false,
  "created_at":"2017-04-19T05:54:24.431Z","followers_count":63,"following_count":22,"statuses_count":123,
  "note":"<p>ぶっちゃけ最近は尻も好きです<br />PGP Key Fingerprint: c3760e259ed09aae51d7d85e893ab07b862199c1</p>",
  "url":"https://oppai.tokyo/@shn",
  "avatar":"https://ot-mastodon.s3.amazonaws.com/accounts/avatars/000/000/001/original/2408e330e310f168.png",
  "avatar_static":"https://ot-mastodon.s3.amazonaws.com/accounts/avatars/000/000/001/original/2408e330e310f168.png",
  "header":"/headers/original/missing.png",
  "header_static":"/headers/original/missing.png"
})

const tokens = [
  new OAuthToken({host: 'oppai.tokyo'}),
]
tokens[0].attachAccount(accountA)


export {accountA, tokens}
