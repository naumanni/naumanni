import {EventEmitter} from 'events'

import {
  EVENT_UPDATE, EVENT_NOTIFICATION, NOTIFICATION_TYPE_MENTION,
  STREAM_HOME, VISIBLITY_DIRECT, WEBSOCKET_EVENT_MESSAGE,
  TOKEN_MENTION, TOKEN_TEXT,
} from 'src/constants'
import {Status} from 'src/models'
import WebsocketManager from 'src/controllers/WebsocketManager'
import TimelineData from 'src/infra/TimelineData'

import {decryptBlocks} from 'src/controllers/PGP'

const _STATE_INITIAL = 'initial'
const _STATE_LOADING = 'loading'
const _STATE_WATCHING = 'watching'


class EncryptedMessage {
  constructor(checksum, total) {
    checksum = checksum.toLowerCase()
    require('assert')(checksum.match(/^[0-9a-f]{8}$/), 'invalid checksum')
    require('assert')(0 < total < 99, 'invalid totalnumber')

    this.checksum = checksum
    this.total = total
    this.blocks = new Array(this.total)

    this.decrypting = false
    this.decrypted = null

    require('assert')(!this.hasAllBlocks())
  }

  set(index, statusRef) {
    require('assert')(statusRef)
    if(index < 1 || index >= self.total)
      throw new Error('invalid index')
    this.blocks[index - 1] = statusRef
  }

  hasAllBlocks() {
    for(let idx=0; idx < this.total; ++idx) {
      if(!this.blocks[idx])
        return false
    }
    return true
  }

  async decrypt(privateKey) {
    console.log('decrypt', this)
    if(this.decrypting)
      return
    this.decrypting = true
    const blocks = this.blocks.map((statusRef) => statusRef.resolve().content)
      .map((content) => content
        .replace('</p>', '\n\n')
        .replace('<br(\s+\/)?>', '\n')
        .replace(/<\/?[^>]+(>|$)/g, '')
      )

    try {
      const decrypted = await decryptBlocks(blocks, privateKey)
      this.decrypted = decrypted
      return decrypted
    } catch(e) {
      console.error('decription failed', e)
    }
  }

  get isDecrypted() {
    return this.decrypted
  }
}


class EncryptedStatus {
  constructor(encryptedMessage) {
    this.encryptedMessage = encryptedMessage
    this.primary = this.encryptedMessage.blocks[0].expand()
  }

  get account() {
    const {account} = this.primary
    return account
  }

  get createdAt() {
    const {status} = this.primary
    return status.createdAt
  }

  get fetchedAt() {
    const {status} = this.primary
    return status.fetchedAt
  }

  get uri() {
    const {status} = this.primary
    return status.uri
  }

  getIdByHost(...args) {
    const {status} = this.primary
    return status.getIdByHost(...args)
  }

  get parsedContent() {
    if(!this.encryptedMessage.isDecrypted) {
      return [{type: 'text', text: '復号中...'}]
    } else {
      return [{type: 'text', text: this.encryptedMessage.decrypted}]
    }
  }
}


export class TalkBlock {
  constructor(lastStatus, account) {
    this.statuses = [lastStatus]
    this.account = account
    this.contents = null
  }

  push(newStatus) {
    // require('assert')(newStatus.createdAt.isAfter(this.statuses[0].createdAt))
    this.statuses.push(newStatus)
    this.statuses.sort((a, b) => -Status.compareForTimeline(a, b))
  }

  isMatch(newStatus) {
    // 発言者が違えば違うBlock
    if(newStatus.account !== this.account.uri)
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
        .map((acct) => requester.searchAccount({q: acct}))
    )

    responses.forEach(({entities, result}) => {
      result
        .map((uri) => entities.accounts[uri])
        .forEach((account) => {
          if(this.members.hasOwnProperty(account.acct))
            this.members[account.acct] = account
        })
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

    for(let loop = 0; loop < 3; ++loop) {
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
      this.statusesMaxId[member.acct] = statusRefs[statusRefs.length - 1].resolve().getIdByHost(host)
      this.pushStatusesIfMatched(statusRefs)
    }
  }

  async listenWebsocket() {
    this.removeWebsocketListenerHandler = WebsocketManager.listen(
      this.token.instance.makeStreamingAPIUrl(this.token, STREAM_HOME),
      ::this.onNewMessageReceived
    )
  }

  /**
   * このTalk向けのStatusesを選んで、更新する。変更があればemitChangeもする
   * @param {Status[]} statuses
   * @return {bool} 更新したか?
   */
  pushStatusesIfMatched(statuses) {
    let memberUris = new Set([
      this.me.uri,
      ...Object.values(this.members).map((account) => account.uri),
    ])

    statuses = statuses
      .filter((status) => status.resolve().visibility === VISIBLITY_DIRECT)
      .filter((status) => {
        const targets = new Set([status.accountUri, ...status.resolve().mentions.map((m) => m.url)])

        if(targets.size !== memberUris.size)
          return false
        for(const x of targets)
          if(!memberUris.has(x))
            return false
        return true
      })
      .filter((status) => !this.statuses.find((s) => s.uri === status.uri))
    if(!statuses.length)
      return false

    this.statuses = this.statuses.concat(statuses)
    this.statuses.sort((a, b) => -Status.compareForTimeline(a.resolve(), b.resolve()))

    // rebuild talks
    this.decryptStatuses()
    this.rebuildTalk()
    this.emitChange()

    return true
  }

  /**
   */
  decryptStatuses() {
    for(const statusRef of this.statuses) {
      let status = statusRef.resolve()
      const blockInfo = status.messageBlockInfo

      if(blockInfo) {
        let encryptedMessage = this.encryptedMessages[blockInfo.checksum]
        if(!encryptedMessage) {
          encryptedMessage = this.encryptedMessages[blockInfo.checksum] =
            new EncryptedMessage(blockInfo.checksum, blockInfo.total)
        }
        encryptedMessage.set(blockInfo.index, statusRef)

        if(encryptedMessage.hasAllBlocks()) {
          // decrypt status
          encryptedMessage.decrypt(this.token.privateKey)
            .then(() => {
              this.rebuildTalk()
              this.emitChange()
            })
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

    for(const statusRef of this.statuses) {
      let status = statusRef.resolve()
      const blockInfo = status.messageBlockInfo

      if(blockInfo) {
        if(pushedEncryptedMessages.has(blockInfo.checksum))
          continue

        const encryptedMessage = this.encryptedMessages[blockInfo.checksum]
        require('assert')(encryptedMessage, 'no encrypt message')
        pushedEncryptedMessages.add(blockInfo.checksum)
        status = new EncryptedStatus(encryptedMessage)
      }

      if(latestTalkBlock && latestTalkBlock.isMatch(status)) {
        latestTalkBlock.push(status)
      } else {
        latestTalkBlock = new TalkBlock(status, statusRef.accountRef.resolve())
        talk.push(latestTalkBlock)
      }
    }

    // make contents
    const targetsAccts = new Set([
      this.me.acct,
      ...Object.values(this.members).map((account) => account.acct),
    ])

    for(const talkBlock of talk) {
      talkBlock.contents = talkBlock.statuses.map((status) => {
        if(status instanceof EncryptedStatus) {
          return {
            key: status.uri,
            parsedContent: status.parsedContent,
            createdAt: status.createdAt,
            encrypted: true,
          }
        } else {
          // 冒頭のmentionだけ省く
          let isHead = true
          let parsedContent = status.parsedContent
            .filter((token) => {
              if(isHead) {
                if(token.type === TOKEN_MENTION && targetsAccts.has(token.acct))
                  return false
                else if(token.type === TOKEN_TEXT && !token.text.trim())
                  return false
                else
                  isHead = false
              }
              return true
            })

          return {
            key: status.uri,
            parsedContent: parsedContent,
            createdAt: status.createdAt,
          }
        }
      })
    }

    // replace
    this.talk = talk
  }

  startWatching() {
    require('assert')(this.state === _STATE_LOADING, 'startWatching(): invalid state')
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
        const {entities, result} = normalizeStatus({result: payload.payload}, host, acct)
        statusRefs = TimelineData.mergeStatuses(entities, [result])
      // これいらんかも
      // } else if(payload.event === EVENT_NOTIFICATION) {
      //   // 送られてきたやつは stream=userに notificationが来る(event=updateももちろん来る)
      //   const {normalizeNotification} = require('src/api/MastodonAPISpec')
      //   const {entities, result} = normalizeNotification(payload.payload, host, acct)
      //   const notification = entities.notifications[result]
      //   statusRefs = TimelineData.mergeStatuses(entities, [notification.status])
      }

      if(statusRefs) {
        this.pushStatusesIfMatched(statusRefs)
      }
    }
  }
}
