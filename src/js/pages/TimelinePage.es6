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
          {this.state.timeline.map((entry) => this.renderTimelineStatus(entry))}
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

  renderTimelineStatus({status, decryptedText}) {
    const account = status.account

    let isDecrypted = false
    let content = status.sanitizedContent
    let spoilerText = status.spoiler_text

    if(decryptedText) {
      isDecrypted = true
      content = decryptedText.content
      spoilerText = decryptedText.spoilerText
    }

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

        <div className="status-body">
          {isDecrypted && <div className="status-isDecrypted"><span className="icon-lock" /> このメッセージは暗号化されています</div>}
          {spoilerText && (
            <div className="status-spoilerText">{spoilerText}</div>
          )}

          <div className="status-content" dangerouslySetInnerHTML={{__html: content}} />
        </div>
      </li>
    )
  }
}
