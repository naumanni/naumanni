import React from 'react'
import {storiesOf, action, linkTo} from '@kadira/storybook'

import {Account, Status} from 'src/models'
import TimelineStatus from '../TimelineStatus'
import {accountA, tokens, setTimeoutAsync} from './fixtures'

const PUBLIC_STATUS = new Status({
  host: 'oppai.tokyo',

  "id": 8159,
  "created_at":"2017-05-06T11:49:51.396Z","in_reply_to_id":null,
  "in_reply_to_account_id":null,
  "sensitive":false,"spoiler_text":"","visibility":"public",
  "application":{"name":"Web","website":null},
  "account": accountA.uri,
  "media_attachments":[],"mentions":[],"tags":[],
  "uri":"tag:oppai.tokyo,2017-05-06:objectId=8159:objectType=Status",
  "content":"<p>aaa</p>",
  "url":"https://oppai.tokyo/@shn/8159",
  "reblogs_count":0,"favourites_count":0,"reblog":null,
  reblogged_by_acct: {
    'shn@oppai.tokyo': false,
    't@mstdn.onosendai.jp': true,
  },
  favourited_by_acct: {
    'shn@oppai.tokyo': true,
    't@mstdn.onosendai.jp': false,
  },
})

const DIRECT_W_REPLY_STATUS = new Status({
  host: 'oppai.tokyo',
  "id":8166,
  "created_at":"2017-05-06T14:08:35.212Z",
  "in_reply_to_id":8161,
  "in_reply_to_account_id":1,
  "sensitive":false,"spoiler_text":"","visibility":"direct","application":{"name":"Web","website":null},
  "account": {
    "id":1,"username":"shn","acct":"shn","display_name":"shn@oppai.tokyo✅","locked":false,"created_at":"2017-04-19T05:54:24.431Z","followers_count":62,"following_count":22,"statuses_count":124,"note":"<p>ぶっちゃけ最近は尻も好きです<br />PGP Key Fingerprint: c3760e259ed09aae51d7d85e893ab07b862199c1</p>","url":"https://oppai.tokyo/@shn","avatar":"https://ot-mastodon.s3.amazonaws.com/accounts/avatars/000/000/001/original/2408e330e310f168.png","avatar_static":"https://ot-mastodon.s3.amazonaws.com/accounts/avatars/000/000/001/original/2408e330e310f168.png","header":"/headers/original/missing.png","header_static":"/headers/original/missing.png"},
  "media_attachments":[],"mentions":[],"tags":[],"uri":"tag:oppai.tokyo,2017-05-06:objectId=8166:objectType=Status","content":"<p>非収録StatusにDM返信</p>","url":"https://oppai.tokyo/@shn/8166","reblogs_count":0,"favourites_count":0,"reblog":null,
  favourited_by_acct: {
    'shn@oppai.tokyo': true,
    't@mstdn.onosendai.jp': false,
  },
  "reblogged":null
})


storiesOf('TimelineStatus', module)
  .addDecorator((story) => (
    <div className="storybookContainer" style={{width: '360px'}}>
      {story()}
    </div>
  ))

  .add('Public', () => {
    return (
      <TimelineStatus
        account={accountA}
        status={PUBLIC_STATUS}
        tokens={tokens}
        onSendReply={(...args) => {
          action('send')(...args)
          return setTimeoutAsync(500)
        }}
        onFavouriteStatus={(...args) => {
          action('send')(...args)
          return setTimeoutAsync(500)
        }}
        onReblogStatus={(...args) => {
          action('send')(...args)
          return setTimeoutAsync(500)
        }}
        onClickToggleFavourite={(...args) => {
          action('send')(...args)
          return setTimeoutAsync(500)
        }}
      />
    )
  })
