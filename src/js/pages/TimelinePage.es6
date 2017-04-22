import {EventEmitter} from 'events'
import React from 'react'
import PropTypes from 'prop-types'

import {Status} from 'src/models'

export default class TimelinePage extends React.Component {
  static contextTypes = {
    context: PropTypes.any,
  }

  constructor(...args) {
    super(...args)

    this.listener = new TimelineListener()
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

  constructor() {
    super()

    this.sources = {}
    this.timeline = []
  }

  open(tokensAndAccounts) {
    this.updateTokens(tokensAndAccounts)
  }

  updateTokens(tokensAndAccounts) {
    const oldMap = {...this.sources}

    this.sources = tokensAndAccounts.reduce((newMap, {token, account}) => {
      if(oldMap.hasOwnProperty(token.address)) {
        newMap[token.address] = oldMap[token.address]
        delete oldMap[token.address]
      } else {
        // add new event source
        const endpoint = `wss://${token.host}/api/v1/streaming/?access_token=${token.accessToken}&stream=public`
        const source = new WebSocket(endpoint)

        source.onopen = this.onOpen.bind(this, token)
        source.onclose = this.onClose.bind(this, token)
        source.onerror = this.onError.bind(this, token)
        source.onmessage = this.onMessage.bind(this, token)

        newMap[token.address] = source

        // 追加時にTimelineをとってくる
        this.onAddNewToken(token)
      }
      return newMap
    }, {})

    // close unused tokens
    Object.values(oldMap).forEach((e) => e.close())
  }

  // websocket event handlers
  onError(token, e) {
    console.log('onError', arguments)
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

  onOpen(token, e) {
    console.log('onOpen', arguments)
  }

  onClose(token, e) {
    console.log('onClose', arguments)
  }

  // listener event handlers
  async onAddNewToken(token) {
    const timeline = await token.requester.listPublicTimeline()
    this.mergeTimeline(timeline)
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
