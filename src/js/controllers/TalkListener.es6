import {EventEmitter} from 'events'

import {NOTIFICATION_TYPE_MENTION, VISIBLITY_DIRECT} from 'src/constants'
import {Status} from 'src/models'


const _STATE_INITIAL = 'initial'
const _STATE_LOADING = 'loading'
const _STATE_WATCHING = 'watching'


class EncryptedMessage {
  constructor(checksum, total) {
    checksum = checksum.toLowerCase()
    require('assert')(checksum.match(/^[0-9a-f]{16}$/))
    require('assert')(0 < total < 99)

    this.checksum = checksum
    this.total = total
    this.blocks = new Array(this.total)

    require('assert')(!this.hasAllBlocks())
  }

  set(index, encodedBlock) {
    if(index < 1 || index >= self.total)
      throw new Error('invalid index')
    this.blocks[index - 1] = encodedBlock
  }

  hasAllBlocks() {
    return this.blocks.every((b) => b)
  }
}


class EncryptedStatus {
  constructor() {
    require('assert')(0, 'not implemented')
  }
}


class TalkBlock {
  constructor(lastStatus) {
    this.statuses = [lastStatus]

    this.account = lastStatus.account
  }

  push(newStatus) {
    require('assert')(newStatus.createdAt.isAfter(this.statuses[0].createdAt))
    this.statuses.unshift(newStatus)
  }

  isMatch(newStatus) {
    if(newStatus instanceof EncryptedStatus) {
      require('assert')(0, 'not implemented')
    }
    // 発言者が違えば違うBlock
    if(!newStatus.account.isEqual(this.account))
      return false

    // 30分離れていたら違うBlock
    const latestAt = this.statuses[0].createdAt
    if(newStatus.createdAt.isAfter(latestAt.add(30, 'm')))
      return false

    return true
  }
}


/**
 * Talkを管理する
 * TalkControllerでいいんでは?
 */
export default class TalkListener extends EventEmitter {
  static EVENT_CHANGE = 'EVENT_CHANGE'

  constructor(memberAccts) {
    for(const memberAcct of memberAccts) {
      require('assert')(typeof memberAcct === 'string')
    }
    require('assert')(memberAccts.length == 1, 'group talk not implemented')

    super()

    this.state = _STATE_INITIAL
    this.token = null
    // 自分以外のMember Object<Acct, Account>
    this.members = memberAccts.reduce((members, acct) => {
      members[acct] = null
      return members
    }, {})
    this.me = null

    // 各Timelineをほじくる際のMaxID。ページングで使う
    this.myStatusesMaxId = undefined
    this.notificationMaxId = undefined

    this.talk = []
    this.statuses = []
    this.encryptedMessages = {}
  }

  updateTokenAndAccount({token, account}) {
    if(this.state === _STATE_INITIAL) {
      this.token = token
      this.me = account

      if(this.token && this.me)
        this.loadStatuses()
    } else {
      require('assert')(this.token)
      require('assert')(this.me)
      if(this.token.isEqual(token) && this.me.isEqual(account)) {
        // nothing changed
      } else {
        require('assert')(0, 'not implemented')
      }
    }
  }

  onChange(cb) {
    this.on(this.EVENT_CHANGE, cb)
    return this.removeListener.bind(this, this.EVENT_CHANGE, cb)
  }

  isWatching() {
    return this.state === _STATE_WATCHING
  }

  isLoading() {
    return this.state !== _STATE_WATCHING
  }

  // private
  async loadStatuses() {
    require('assert')(this.state === _STATE_INITIAL)
    this.state = _STATE_LOADING

    // まず宛先Accountを把握
    await this.loadAccounts()
    // みんなの発言を把握
    await Promise.all([
      this.loadMyStatuses(),
      this.loadMemberStatuses(),
    ])

    // 読み込み終わったのでWatchを開始する
    this.startWatching()
    this.state = _STATE_WATCHING
  }

  async loadAccounts() {
    const {requester} = this.token
    const responses = await Promise.all(
      Object.keys(this.members)
        .map((acct) => requester.searchAccount({q: acct, limit: 1}))
    )

    responses.forEach((accounts) => {
      if(accounts.length > 0) {
        const account = accounts[0]
        if(this.members.hasOwnProperty(account.acct))
          this.members[account.acct] = account
      }
    })

    // アカウント取得できていないやつが入ればエラー
    const johndoes = Object.keys(this.members).filter((acct) => this.members[acct] === null)
    if(johndoes.length) {
      new Error(`Unknown accounts ${johndoes}`)
    }

    this.emitChange()
  }

  // 自分の発言を読み込んでいく
  async loadMyStatuses() {
    const {requester} = this.token

    for(let loop = 0; loop < 5; ++loop) {
    // for(;;) {
      const maxId = this.myStatusesMaxId
      if(maxId === 0)
        break

      const statuses = await requester.listStatuses({id: this.me.id, limit: 40, max_id: maxId})
      if(!statuses.length) {
        this.myStatusesMaxId = 0
        break
      }

      this.pushStatusesIfMatched(statuses)
      this.myStatusesMaxId = statuses[statuses.length - 1].id
    }
  }

  // メンバーの発言を読み込んでいく
  async loadMemberStatuses() {
    const {requester} = this.token

    for(let loop = 0; loop < 5; ++loop) {
      const maxId = this.notificationMaxId
      if(maxId === 0)
        break

      const notifications = await requester.listNotifications({limit: 30, max_id: maxId})
      if(!notifications.length) {
        this.notificationMaxId = 0
        break
      }

      this.pushStatusesIfMatched(
        notifications
          .filter((noty) => noty.type === NOTIFICATION_TYPE_MENTION && noty.status.visibility === VISIBLITY_DIRECT)
          .map((noty) => noty.status)

      )
      this.notificationMaxId = notifications[notifications.length - 1].id
    }
  }

  /**
   * このTalk向けのStatusesを選んで、更新する。変更があればemitChangeもする
   */
  pushStatusesIfMatched(statuses) {
    let targetsAccountIds = [this.me.id, ...Object.values(this.members).map((account) => account.id)]

    statuses = statuses
      .filter((status) =>
        status.visibility === VISIBLITY_DIRECT &&
        targetsAccountIds.every((id) => status.account.id === id || status.isMentionToId(id)))
      .filter((status) => !this.statuses.find((s) => s.id === status.id))
    if(!statuses.length)
      return false

    this.statuses = this.statuses.concat(statuses)
    this.statuses.sort((a, b) => -Status.compareCreatedAt(a, b))

    // rebuild talks
    this.decryptStatuses()
    this.rebuildTalk()

    this.emitChange()

    return true
  }

  /**
   */
  decryptStatuses() {
    for(const status of this.statuses) {
      const blockInfo = status.messageBlockInfo

      if(blockInfo) {
        let encryptedMessage = this.encryptedMessages[blockInfo.checksum]
        if(!encryptedMessage)
          encryptedMessage = this.encryptedMessages[blockInfo.checksum] =
            new EncryptedMessage(blockInfo.checksum, blockInfo.total)
        encryptedMessage.set(blockInfo.index, status.encoded)

        if(encryptedMessage.hasAllBlocks()) {
          // decrypt status
          console.log('decrypt', encryptedMessage)
        }
      }
    }
  }

  /**
   */
  rebuildTalk() {
    const talk = []
    let latestTalkBlock = null
    const pushedEncryptedMessages = new Set()

    for(let status of this.statuses) {
      const blockInfo = status.messageBlockInfo

      if(blockInfo) {
        if(pushedEncryptedMessages.has(blockInfo.checksum))
          continue

        const encryptedMessage = this.encryptedMessages[blockInfo.checksum]
        require('assert')(encryptedMessage)
        pushedEncryptedMessages.add(blockInfo.checksum)
        status = new EncryptedStatus(encryptedMessage)
      }

      if(latestTalkBlock && latestTalkBlock.isMatch(status)) {
        latestTalkBlock.push(status)
      } else {
        latestTalkBlock = new TalkBlock(status)
        talk.push(latestTalkBlock)
      }
    }

    // replace
    this.talk = talk
  }

  startWatching() {
    require('assert')(this.state === _STATE_LOADING)
    this.state = _STATE_WATCHING
    this.emitChange()
  }

  emitChange() {
    this.emit(this.EVENT_CHANGE, this)
  }
}


/*

自分の送ったDirect Messageは steam=user に来る
{"event":"update","payload":"{\"id\":8053,\"created_at\":\"2017-05-04T17:34:46.761Z\",\"in_reply_to_id\":null,\"in_reply_to_account_id\":null,\"sensitive\":null,\"spoiler_text\":\"\",\"visibility\":\"direct\",\"application\":{\"name\":\"naumanniskine\",\"website\":null},\"account\":{\"id\":1,\"username\":\"shn\",\"acct\":\"shn\",\"display_name\":\"shn@oppai.tokyo✅\",\"locked\":false,\"created_at\":\"2017-04-19T05:54:24.431Z\",\"followers_count\":62,\"following_count\":22,\"statuses_count\":95,\"note\":\"ぶっちゃけ最近は尻も好きです\\nPGP Key Fingerprint: c3760e259ed09aae51d7d85e893ab07b862199c1\",\"url\":\"https://oppai.tokyo/@shn\",\"avatar\":\"https://ot-mastodon.s3.amazonaws.com/accounts/avatars/000/000/001/original/2408e330e310f168.png?1492583237\",\"avatar_static\":\"https://ot-mastodon.s3.amazonaws.com/accounts/avatars/000/000/001/original/2408e330e310f168.png?1492583237\",\"header\":\"/headers/original/missing.png\",\"header_static\":\"/headers/original/missing.png\"},\"media_attachments\":[],\"mentions\":[{\"url\":\"https://mstdn.onosendai.jp/@shn\",\"acct\":\"shn@mstdn.onosendai.jp\",\"id\":134,\"username\":\"shn\"}],\"tags\":[],\"uri\":\"tag:oppai.tokyo,2017-05-04:objectId=8053:objectType=Status\",\"content\":\"<p><span class=\\\"h-card\\\"><a href=\\\"https://mstdn.onosendai.jp/@shn\\\" class=\\\"u-url mention\\\">@<span>shn</span></a></span> mogemoge</p>\",\"url\":\"https://oppai.tokyo/@shn/8053\",\"reblogs_count\":0,\"favourites_count\":0,\"reblog\":null,\"favourited\":false,\"reblogged\":false}"}

送られてきたやつは stream=userに notificationが来る(event=updateももちろん来る)
{"event":"notification","payload":"{\"id\":213,\"type\":\"mention\",\"created_at\":\"2017-05-04T17:40:04.234Z\",\"account\":{\"id\":134,\"username\":\"shn\",\"acct\":\"shn@mstdn.onosendai.jp\",\"display_name\":\"shn\",\"locked\":false,\"created_at\":\"2017-04-20T02:15:06.549Z\",\"followers_count\":1,\"following_count\":0,\"statuses_count\":29,\"note\":\"ッピ\",\"url\":\"https://mstdn.onosendai.jp/@shn\",\"avatar\":\"https://ot-mastodon.s3.amazonaws.com/accounts/avatars/000/000/134/original/6d0c551793738f92.jpg?1492654506\",\"avatar_static\":\"https://ot-mastodon.s3.amazonaws.com/accounts/avatars/000/000/134/original/6d0c551793738f92.jpg?1492654506\",\"header\":\"https://ot-mastodon.s3.amazonaws.com/accounts/headers/000/000/134/original/missing.png?1492654506\",\"header_static\":\"https://ot-mastodon.s3.amazonaws.com/accounts/headers/000/000/134/original/missing.png?1492654506\"},\"status\":{\"id\":8055,\"created_at\":\"2017-05-04T17:40:03.000Z\",\"in_reply_to_id\":8054,\"in_reply_to_account_id\":1,\"sensitive\":false,\"spoiler_text\":\"\",\"visibility\":\"direct\",\"application\":null,\"account\":{\"id\":134,\"username\":\"shn\",\"acct\":\"shn@mstdn.onosendai.jp\",\"display_name\":\"shn\",\"locked\":false,\"created_at\":\"2017-04-20T02:15:06.549Z\",\"followers_count\":1,\"following_count\":0,\"statuses_count\":29,\"note\":\"ッピ\",\"url\":\"https://mstdn.onosendai.jp/@shn\",\"avatar\":\"https://ot-mastodon.s3.amazonaws.com/accounts/avatars/000/000/134/original/6d0c551793738f92.jpg?1492654506\",\"avatar_static\":\"https://ot-mastodon.s3.amazonaws.com/accounts/avatars/000/000/134/original/6d0c551793738f92.jpg?1492654506\",\"header\":\"https://ot-mastodon.s3.amazonaws.com/accounts/headers/000/000/134/original/missing.png?1492654506\",\"header_static\":\"https://ot-mastodon.s3.amazonaws.com/accounts/headers/000/000/134/original/missing.png?1492654506\"},\"media_attachments\":[],\"mentions\":[{\"url\":\"https://oppai.tokyo/@shn\",\"acct\":\"shn\",\"id\":1,\"username\":\"shn\"}],\"tags\":[],\"uri\":\"tag:mstdn.onosendai.jp,2017-05-04:objectId=158633:objectType=Status\",\"content\":\"<p><span class=\\\"h-card\\\"><a href=\\\"https://oppai.tokyo/@shn\\\" class=\\\"u-url mention\\\">@<span>shn</span></a></span> あ<br>い<br>う<br>え<br>お<br>か<br>き<br>く<br>け<br>こ</p>\",\"url\":\"https://mstdn.onosendai.jp/users/shn/updates/4027\",\"reblogs_count\":0,\"favourites_count\":0,\"reblog\":null,\"favourited\":false,\"reblogged\":false}}"}

*/
