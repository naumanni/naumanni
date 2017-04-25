import {EventEmitter} from 'events'
import React from 'react'
import PropTypes from 'prop-types'

import {Status} from 'src/models'


const TIMELINE_FEDERATION = 'federation'
const TIMELINE_LOCAL = 'local'
const TIMELINE_HOME = 'home'

const COMPOUND_TIMELINE = Symbol('COMPOUND_TIMELINE')


export default class TimelinePage extends React.Component {
  static contextTypes = {
    context: PropTypes.any,
  }

  constructor(props, ...args) {
    super(props, ...args)

    // get timeline type
    let subject
    if(props.match.params.acct) {
      // this is user local timeline
      subject = props.match.params.acct
    } else {
      // this is compound timeline
      subject = COMPOUND_TIMELINE
    }
    const timelineType = props.match.params[0]

    this.listener = new TimelineListener(subject, timelineType)
    this.state = {
      timeline: this.listener.timeline,
      ...this.getStateFromContext(),
    }
  }

  /**
   * @override
   */
  componentDidMount() {
    // update accounts
    const {context} = this.context

    this.listenerRemovers = [
      this.listener.onChange(::this.onChangeTimeline),
      context.onChange(::this.onChangeAccounts),
    ]

    // make event listener
    this.listener.open(this.state.accountsState.tokensAndAccounts)
  }

  /**
   * @override
   */
  componentWillUnmount() {
    for(const remover of this.listenerRemovers) {
      remover()
    }
  }

  /**
   * @override
   */
  render() {
    return (
      <div className="page page-timeline">
        <ul className="timeline">
          {this.state.timeline.map((status) => this.renderTimelineStatus(status))}
        </ul>
      </div>
    )
  }

  getStateFromContext() {
    const {accountsState} = this.context.context.getState()
    return {
      accountsState,
    }
  }

  onChangeTimeline() {
    this.setState({timeline: this.listener.timeline})
  }

  onChangeAccounts() {
    this.setState(
      this.getStateFromContext(),
      () => {
        this.listener.updateTokens(this.state.accountsState.tokensAndAccounts)
      })
  }

  renderTimelineStatus(status) {
    const account = status.accountObject
    return (
      <li key={status.uri} className="status">
        <img className="status-avatar" src={account.avatar} />
        <div className="status-info">
          <span className="status-displayName">{account.display_name || account.username}</span>
          <span className="status-account">{account.account}</span>
          <a className="status-createdAt"
             href={status.url}
             target="_blank"
             alt={status.created_at}>{status.createdAt.fromNow()}
          </a>
        </div>
        <div className="status-content" dangerouslySetInnerHTML={{__html: status.sanitizedContent}} />
      </li>
    )
  }
}


class TimelineListener extends EventEmitter {
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
    const _ = (token, type, fetcher) => {
      return {
        key: `${token.address}:${type}`,
        fetcher: {token, type, ...fetcher},
      }
    }

    const newSources = tokensAndAccounts.reduce((newSources, {token, account}) => {
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
            _(token, 'websocket', {url: `${websocketBase}user`}),
            _(token, 'api', {func: ::requester.listHomeTimeline}),
          )
        break

      case TIMELINE_LOCAL:
        newSources.push(
            _(token, 'websocket', {url: `${websocketBase}public:local`}),
            _(token, 'api', {func: requester.listPublicTimeline.bind(requester, {'local': 'true'})}),
          )
        break

      case TIMELINE_FEDERATION:
        newSources.push(
            _(token, 'websocket', {url: `${websocketBase}public`}),
            _(token, 'api', {func: ::requester.listPublicTimeline}),
          )
        break
      }
      return newSources
    }, [])

    console.log('newSources', newSources)

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

        socket.onopen = this.onOpen.bind(this, token)
        socket.onclose = this.onClose.bind(this, token)
        socket.onerror = this.onError.bind(this, token)
        socket.onmessage = this.onMessage.bind(this, token)
        this.websockets[url] = socket
      } else if(fetcher.type === 'api') {
        fetcher.func().then((timeline) => {
          this.mergeTimeline(timeline)
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
  onError(token, e, ...args) {
    console.log('onError', token, e, args)
  }

  onMessage(token, e) {
    const frame = JSON.parse(e.data)
    const payload = frame.payload && JSON.parse(frame.payload)
    const {event} = frame

    switch(event) {
    case 'update':
      this.pushStatus(new Status({
        host: token.host,
        ...payload,
      }))
      break
    default:
      console.log('onMessage', token, event, payload)
      break
    }
  }

  onOpen(token, e, ...args) {
    console.log('onOpen', token, e, args)
  }

  onClose(token, e, ...args) {
    console.log('onClose', token, e, args)
  }

  //
  mergeTimeline(newStatues) {
    let newTimeline =
      newStatues
        .filter((status) => !this.timeline.find((old) => old.uri === status.uri))
        .concat(this.timeline)
    newTimeline.sort((a, b) => {
      if(a.created_at < b.created_at)
        return 1
      else if(a.created_at > b.created_at)
        return -1
      return 0
    })
    newTimeline = newTimeline.slice(0, 100)

    this.timeline = newTimeline
    this.emitChange()
  }

  pushStatus(newStatus) {
    if(this.timeline.find((old) => old.uri === newStatus.uri)) {
      // already exists
      return
    }

    this.timeline = [newStatus].concat(this.timeline)
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
