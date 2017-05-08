import {EventEmitter} from 'events'

import {
  EVENT_UPDATE, EVENT_NOTIFICATION, NOTIFICATION_TYPE_MENTION,
  STREAM_HOME, VISIBLITY_DIRECT, WEBSOCKET_EVENT_MESSAGE,
} from 'src/constants'
import {Status} from 'src/models'
import WebsocketManager from 'src/controllers/WebsocketManager'
import TimelineData from 'src/infra/TimelineData'
import {makeWebsocketUrl} from 'src/utils'


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
    // require('assert')(newStatus.createdAt.isAfter(this.statuses[0].createdAt))
    this.statuses.push(newStatus)
    this.statuses.sort((a, b) => -Status.compareCreatedAt(a, b))
  }

  isMatch(newStatus) {
    if(newStatus instanceof EncryptedStatus) {
      require('assert')(0, 'not implemented')
    }
    // 発言者が違えば違うBlock
    if(!newStatus.account === this.account)
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
    this.statusesMaxId = {}

    this.talk = []
    this.statuses = []
    this.encryptedMessages = {}

    this.removeWebsocketListenerHandler = null
  }

  updateToken(token) {
    if(this.state === _STATE_INITIAL) {
      this.token = token
      this.me = token && token.account

      if(this.token && this.me)
        this.start()
    } else {
      require('assert')(this.token)
      require('assert')(this.me)
      if(this.token.isEqual(token) && this.me.isEqual(token ? token.account : null)) {
        // nothing changed
      } else {
        require('assert')(0, 'not implemented')
      }
    }
  }

  close() {
    if(this.removeWebsocketListenerHandler) {
      this.removeWebsocketListenerHandler()
      this.removeWebsocketListenerHandler = null
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
  async start() {
    require('assert')(this.state === _STATE_INITIAL)
    this.state = _STATE_LOADING

    // まず宛先Accountを把握
    await this.loadAccounts()

    // みんなの発言を把握すると同時に、websocketのlistenも開始する
    await Promise.all([
      this.listenWebsocket(),
      this.loadStatuses(this.me),
      ...[Object.values(this.members).map((mem) => this.loadStatuses(mem))],
    ])

    // 読み込み終わったのでWatchを開始する
    this.state = _STATE_WATCHING
    this.emitChange()
  }

  async loadAccounts() {
    const {requester} = this.token
    const responses = await Promise.all(
      Object.keys(this.members)
        .map((acct) => requester.searchAccount({q: acct, limit: 1}))
    )

    responses.forEach(({entities, result}) => {
      if(result.length > 0) {
        const account = entities.accounts[result[0]]
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

  // メンバーの発言を読み込んでいく
  async loadStatuses(member) {
    const {host, requester} = this.token

    for(let loop = 0; loop < 5; ++loop) {
      const maxId = this.statusesMaxId[member.acct]
      if(maxId === 0)
        break

      const {entities, result} = await requester.listStatuses({
        id: member.getIdByHost(host),
        limit: 40,
        max_id: maxId,
        visibility: VISIBLITY_DIRECT,
      },
        {token: this.token})

      if(!result.length) {
        this.statusesMaxId[member.acct] = 0
        break
      }

      const statusRefs = TimelineData.mergeStatuses(entities, result)
      this.statusesMaxId[member.acct] = statusRefs[statusRefs.length - 1].getIdByHost(host)
      this.pushStatusesIfMatched(statusRefs)
    }
  }

  async listenWebsocket() {
    this.removeWebsocketListenerHandler = WebsocketManager.listen(
      makeWebsocketUrl(this.token, STREAM_HOME),
      ::this.onNewMessageReceived
    )
  }

  /**
   * このTalk向けのStatusesを選んで、更新する。変更があればemitChangeもする
   * @param {Status[]} statuses
   * @return {bool} 更新したか?
   */
  pushStatusesIfMatched(statuses) {
    let targetsAccountUris = [
      this.me.uri,
      ...Object.values(this.members).map((account) => account.uri),
    ]

    statuses = statuses
      .filter((status) => status.visibility === VISIBLITY_DIRECT)
      .filter((status) => targetsAccountUris.every((uri) => status.account.uri === uri || status.isMentionToURI(uri)))
      .filter((status) => !this.statuses.find((s) => s.uri === status.uri))
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

  onNewMessageReceived({type, payload}) {
    if(type === WEBSOCKET_EVENT_MESSAGE) {
      const {host, acct} = this.token
      let statusRefs

      if(payload.event === EVENT_UPDATE) {
        // 自分の送ったDirect Messageは steam=user に来る
        const {normalizeStatus} = require('src/api/MastodonAPISpec')
        const {entities, result} = normalizeStatus(payload.payload, host, acct)
        statusRefs = TimelineData.mergeStatuses(entities, [result])
      } else if(payload.event === EVENT_NOTIFICATION) {
        // 送られてきたやつは stream=userに notificationが来る(event=updateももちろん来る)
        const {normalizeNotification} = require('src/api/MastodonAPISpec')
        const {entities, result} = normalizeNotification(payload.payload, host, acct)
        const notification = entities.notifications[result]
        statusRefs = TimelineData.mergeStatuses(entities, [notification.status])
      }

      if(statusRefs) {
        this.pushStatusesIfMatched(statusRefs)
      }
    }
  }
}
