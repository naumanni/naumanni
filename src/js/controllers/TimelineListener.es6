import {EventEmitter} from 'events'

import {
  TIMELINE_FEDERATION, TIMELINE_LOCAL, TIMELINE_HOME, COMPOUND_TIMELINE,
} from 'src/constants'
import {Status} from 'src/models'


export class TimelineEntry {
  constructor(status) {
    this.status = status
  }

  static compare(a, b) {
    const aAt = a.status.created_at
    const bAt = b.status.created_at
    if(aAt < bAt)
      return 1
    else if(aAt > bAt)
      return -1
    return 0
  }
}


export default class TimelineListener extends EventEmitter {
  static EVENT_CHANGE = 'EVENT_CHANGE'

  constructor(subject, timelineType) {
    super()

    this.subject = subject
    this.timelineType = timelineType

    this.sources = []
    this.websockets = {}
    this.timeline = []
  }

  open(tokensAndAccounts) {
    this.updateTokens(tokensAndAccounts)
  }

  updateTokens(tokensAndAccounts) {
    const _ = (token, account, type, fetcher) => {
      return {
        key: `${token.address}:${type}`,
        fetcher: {account, token, type, ...fetcher},
      }
    }

    const newSources = tokensAndAccounts.reduce((newSources, {token, account}) => {
      if(!token || !account)
        return newSources

      if(this.subject == COMPOUND_TIMELINE) {
        // 複合タイムラインなのでALL OK
      } else {
        // Accountタイムラインなので、一致しないアカウントは無視
        if(account.address !== this.subject)
          return newSources
      }

      // add websocket
      const websocketBase = `wss://${token.host}/api/v1/streaming/?access_token=${token.accessToken}&stream=`
      const requester = token.requester

      switch(this.timelineType) {
      case TIMELINE_HOME:
        newSources.push(
            _(token, account, 'websocket', {url: `${websocketBase}user`}),
            _(token, account, 'api', {func: ::requester.listHomeTimeline}),
          )
        break

      case TIMELINE_LOCAL:
        newSources.push(
            _(token, account, 'websocket', {url: `${websocketBase}public:local`}),
            _(token, account, 'api', {func: requester.listPublicTimeline.bind(requester, {'local': 'true'})}),
          )
        break

      case TIMELINE_FEDERATION:
        newSources.push(
            _(token, account, 'websocket', {url: `${websocketBase}public`}),
            _(token, account, 'api', {func: ::requester.listPublicTimeline}),
          )
        break
      }
      return newSources
    }, [])

    const newKeys = new Set(newSources.map(({key}) => key))
    const oldKeys = new Set(this.sources.map(({key}) => key))

    // 新しい接続を開始する
    newSources.forEach(({key, fetcher}) => {
      if(oldKeys.has(key)) {
        return
      }

      if(fetcher.type === 'websocket') {
        const {token, url} = fetcher
        console.log('open websocket', url)
        const socket = new WebSocket(url)

        socket.onopen = this.onOpen.bind(this, token, fetcher.account)
        socket.onclose = this.onClose.bind(this, token, fetcher.account)
        socket.onerror = this.onError.bind(this, token, fetcher.account)
        socket.onmessage = this.onMessage.bind(this, token, fetcher.account)
        this.websockets[url] = socket
      } else if(fetcher.type === 'api') {
        fetcher.func().then((timeline) => {
          this.pushStatus(fetcher.token, fetcher.account, timeline)
        })
      }
    })

    // 古い接続を閉じる
    this.sources.forEach(({key, fetcher}) => {
      if(newKeys.has(key))
        return

      if(fetcher.type == 'websocket') {
        const {url} = fetcher
        console.log('close websocket', url)
        this.websockets[url].close()
        delete this.websockets[url]
      }
    })

    this.sources = newSources
  }

  // websocket event handlers
  onError(token, account, e, ...args) {
    console.log('onError', token, account, e, args)
  }

  onMessage(token, account, e) {
    const frame = JSON.parse(e.data)
    const payload = frame.payload && JSON.parse(frame.payload)
    const {event} = frame

    switch(event) {
    case 'update':
      this.pushStatus(token, account, new Status({
        host: token.host,
        ...payload,
      }))
      break
    default:
      console.log('onMessage', token, account, event, payload)
      break
    }
  }

  onOpen(token, account, e, ...args) {
    console.log('onOpen', token, account, e, args)
  }

  onClose(token, account, e, ...args) {
    console.log('onClose', token, account, e, args)
  }

  /**
   * StatusをTimelineに追加する
   * @param {OAuthTokeb} token
   * @param {Account} account
   * @param {Status[]} newStatuses
   */
  pushStatus(token, account, newStatuses) {
    if(!Array.isArray(newStatuses)) {
      newStatuses = [newStatuses]
    }

    // remove exists
    newStatuses = newStatuses
      .filter((status) => !this.timeline.find((old) => old.status.uri === status.uri))
      .map((status) => new TimelineEntry(status))

    newStatuses.forEach((entry) => {
      if(entry.status.hasEncryptedStatus) {
        decryptStatus(account, entry.status)
          .then((decryptedText) => {
            entry.decryptedText = decryptedText
            this.emitChange()
          }, (error) => console.error('decrypt failed', error)
        )
      }
    })

    this.timeline = newStatuses
      .concat(this.timeline)
      .sort(TimelineEntry.compare)
    this.emitChange()
  }

  onChange(cb) {
    this.on(this.EVENT_CHANGE, cb)
    return this.removeListener.bind(this, this.EVENT_CHANGE, cb)
  }

  emitChange() {
    this.emit(this.EVENT_CHANGE, [this])
  }
}


import base65536 from 'base65536'
import openpgp, {key as openpgpKey, message as openpgpMessage} from 'openpgp'


async function decryptStatus(account, status) {
  const privatekey = openpgpKey.readArmored(account.privateKeyArmored)

  // status
  const response = {}

  await Promise.all([
    ['content', status.content, '&lt;nem&gt;', '&lt;/nem&gt;'],
    ['spoilerText', status.spoiler_text, '<nem>', '</nem>'],
  ].map(async ([key, text, open, close]) => {
    const [before, content, after] = extractText(text, open, close)
    const messageToDecrypt = openpgpMessage.read(base65536.decode(content))

    const decyrptedText = await openpgp.decrypt({
      message: messageToDecrypt,
      privateKey: privatekey.keys[0],
    })

    response[key] = before + decyrptedText.data + after
  }))

  return response
}


function extractText(text, open, close) {
  const [before, rest] = text.split(open, 2)
  const [content, after] = rest.split(close, 2)
  return [before, content, after]
}
