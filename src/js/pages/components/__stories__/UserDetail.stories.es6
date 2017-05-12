import React from 'react'
import {storiesOf, action, linkTo} from '@kadira/storybook'

import {Account, OAuthToken} from 'src/models'
import {DIALOG_USER_DETAIL} from 'src/constants'
import {UIDialog} from 'src/models'
import UserDetail from '../UserDetail'


const accountNormal = new Account({
  "id":983,
  "username":"shn",
  "acct":"shn@mstdn.onosendai.jp",
  "display_name":"shn","locked":false,"created_at":"2017-04-17T09:12:38.610Z",
  "followers_count":73,"following_count":21,"statuses_count":76,
  "note":"<p>ッピ</p>",
  "url":"https://mstdn.onosendai.jp/@shn",
  "avatar":"https://mstdn.onosendai.jp/system/accounts/avatars/000/000/983/original/6d0c551793738f92.jpg?1492420497",
  "avatar_static":"https://mstdn.onosendai.jp/system/accounts/avatars/000/000/983/original/6d0c551793738f92.jpg?1492420497",
  header: "https://mstdn.onosendai.jp/system/accounts/headers/000/000/983/original/761f95dfabb9eec7.jpg?1494321148",
  header_static: "https://mstdn.onosendai.jp/system/accounts/headers/000/000/983/original/761f95dfabb9eec7.jpg?1494321148"
})
const accountLocked = new Account({
  "id":11521,"username":"shnx","acct":"shnx@pawoo.net","display_name":"",
  locked:true,
  "created_at":"2017-05-10T01:01:43.404Z","followers_count":0,"following_count":0,"statuses_count":4,
  note: '<a href="https://www.youtube.com/" rel="nofollow noopener" target="_blank"><span class="invisible">https://www.</span><span class="">youtube.com/</span><span class="invisible"></span></a>',
  "url":"https://pawoo.net/@shnx","avatar":"https://mstdn.onosendai.jp/system/accounts/avatars/000/011/521/original/data.png?1494378103","avatar_static":"https://mstdn.onosendai.jp/system/accounts/avatars/000/011/521/original/data.png?1494378103","header":"https://mstdn.onosendai.jp/headers/original/missing.png","header_static":"https://mstdn.onosendai.jp/headers/original/missing.png"
})
// {"id":4182,"username":"shn","acct":"shn@oppai.tokyo","display_name":"shn@oppai.tokyo✅","locked":false,"created_at":"2017-04-19T08:40:24.660Z","followers_count":5,"following_count":3,"statuses_count":91,"note":"<p>ぶっちゃけ最近は尻も好きです<br>PGP Key Fingerprint: c3760e259ed09aae51d7d85e893ab07b862199c1</p>","url":"https://oppai.tokyo/@shn","avatar":"https://mstdn.onosendai.jp/system/accounts/avatars/000/004/182/original/2408e330e310f168.png?1493984755","avatar_static":"https://mstdn.onosendai.jp/system/accounts/avatars/000/004/182/original/2408e330e310f168.png?1493984755","header":"https://mstdn.onosendai.jp/headers/original/missing.png","header_static":"https://mstdn.onosendai.jp/headers/original/missing.png"},
// {"id":4308,"username":"shnva","acct":"shnva@pawoo.net","display_name":"shnva（シノバ）","locked":false,"created_at":"2017-04-19T11:55:52.192Z","followers_count":0,"following_count":0,"statuses_count":7,"note":"めーぐりめぐってえぶりわん\n<a href=\"http://www.pixiv.net/member.php?id=12296581\"><span class=\"invisible\">http://www.</span><span class=\"ellipsis\">pixiv.net/member.php?id=122965</span><span class=\"invisible\">81</span></a>\n<a href=\"https://twitter.com/shinonova_ra\"><span class=\"invisible\">https://</span><span class=\"\">twitter.com/shinonova_ra</span><span class=\"invisible\"></span></a>","url":"https://pawoo.net/@shnva","avatar":"https://mstdn.onosendai.jp/system/accounts/avatars/000/004/308/original/64ef62b2e870c67d.png?1492602952","avatar_static":"https://mstdn.onosendai.jp/system/accounts/avatars/000/004/308/original/64ef62b2e870c67d.png?1492602952","header":"https://mstdn.onosendai.jp/system/accounts/headers/000/004/308/original/b73c02dc427a97ad.png?1492602952","header_static":"https://mstdn.onosendai.jp/system/accounts/headers/000/004/308/original/b73c02dc427a97ad.png?1492602952"},

const tokenA = new OAuthToken({})
tokenA.attachAccount(new Account({
  acct: 'testA@mstdn.onosendai.jp',
}))
const tokenB = new OAuthToken({})
tokenB.attachAccount(new Account({
  acct: 'testB@mstdn.onosendai.jp',
}))
const tokenC = new OAuthToken({})
tokenC.attachAccount(new Account({
  acct: 'testC@mstdn.onosendai.jp',
}))
const tokenSelf = new OAuthToken({})
tokenSelf.attachAccount(new Account({
  acct: 'shn@mstdn.onosendai.jp',
}))


storiesOf('UserDetailDialog', module)
  .addDecorator((story) => (
    <div className="storybookContainer" style={{width: '360px'}}>
      {story()}
    </div>
  ))

  .add('normal w/ multi tokens', () => {
    const params = {acct: 'shn@mstdn.onosendai.jp'}
    return (
      <UserDetail
        account={accountNormal}
        tokens={[tokenA, tokenB, tokenC, tokenSelf]}
        relationships={{
          [tokenA.acct]: {following: false, requested: false},
          [tokenB.acct]: {following: true, requested: false},
          [tokenC.acct]: {following: false, requested: true},
          [tokenSelf.acct]: {following: false, requested: false},
        }}
        onOpenTalkClicked={action('onOpenTalkClicked')}
        onToggleFollowClicked={action('onToggleFollowClicked')}
      />
    )
  })

  .add('normal w/ non followed token', () => {
    const params = {acct: 'shn@mstdn.onosendai.jp'}
    return (
      <UserDetail
        account={accountNormal}
        tokens={[tokenA]}
        relationships={{
          [tokenA.acct]: {following: false, requested: false},
          [tokenB.acct]: {following: true, requested: false},
          [tokenC.acct]: {following: false, requested: true},
        }}
        onOpenTalkClicked={action('onOpenTalkClicked')}
        onToggleFollowClicked={action('onToggleFollowClicked')}
      />
    )
  })

  .add('normal w/ following token', () => {
    const params = {acct: 'shn@mstdn.onosendai.jp'}
    return (
      <UserDetail
        account={accountNormal}
        tokens={[tokenB]}
        relationships={{
          [tokenA.acct]: {following: false, requested: false},
          [tokenB.acct]: {following: true, requested: false},
          [tokenC.acct]: {following: false, requested: true},
        }}
        onOpenTalkClicked={action('onOpenTalkClicked')}
        onToggleFollowClicked={action('onToggleFollowClicked')}
      />
    )
  })

  .add('normal w/ requested tokens', () => {
    const params = {acct: 'shn@mstdn.onosendai.jp'}
    return (
      <UserDetail
        account={accountNormal}
        tokens={[tokenC]}
        relationships={{
          [tokenA.acct]: {following: false, requested: false},
          [tokenB.acct]: {following: true, requested: false},
          [tokenC.acct]: {following: false, requested: true},
        }}
        onOpenTalkClicked={action('onOpenTalkClicked')}
        onToggleFollowClicked={action('onToggleFollowClicked')}
      />
    )
  })

  .add('normal w/ himself', () => {
    const params = {acct: 'shn@mstdn.onosendai.jp'}
    return (
      <UserDetail
        account={accountNormal}
        tokens={[tokenSelf]}
        relationships={{
          [tokenSelf.acct]: {following: false, requested: false},
        }}
        onOpenTalkClicked={action('onOpenTalkClicked')}
        onToggleFollowClicked={action('onToggleFollowClicked')}
      />
    )
  })

  .add('locked w/ unfollowing tokens', () => {
    const params = {acct: 'shn@mstdn.onosendai.jp'}
    return (
      <UserDetail
        account={accountLocked}
        tokens={[tokenA]}
        relationships={{
          [tokenA.acct]: {following: false, requested: false},
          [tokenB.acct]: {following: true, requested: false},
          [tokenC.acct]: {following: false, requested: true},
        }}
        onOpenTalkClicked={action('onOpenTalkClicked')}
        onToggleFollowClicked={action('onToggleFollowClicked')}
      />
    )
  })
