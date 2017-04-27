import React from 'react'
import PropTypes from 'prop-types'

import {
  TIMELINE_FEDERATION, TIMELINE_LOCAL, TIMELINE_HOME, COMPOUND_TIMELINE,
} from 'src/constants'
import TimelineListener from 'src/controllers/TimelineListener'
import Column from './Column'


// TODO: i10n
const TYPENAMEMAP = {
  [TIMELINE_FEDERATION]: '連合タイムライン',
  [TIMELINE_LOCAL]: 'ローカルタイムライン',
  [TIMELINE_HOME]: 'ホームタイムライン',
}


/**
 * タイムラインのカラム
 */
export default class TimelineColumn extends Column {
  static propTypes = {
    subject: PropTypes.string.isRequired,
    timelineType: PropTypes.string.isRequired,
  }

  constructor(...args) {
    super(...args)

    const {subject, timelineType} = this.props

    this.listener = new TimelineListener(subject, timelineType)
    this.state.loading = true
  }

  /**
   * @override
   */
  componentDidMount() {
    super.componentDidMount()

    this.listenerRemovers.push(
      this.listener.onChange(::this.onChangeTimeline),
    )

    // make event listener
    this.listener.open(this.state.accountsState.tokensAndAccounts)
  }

  /**
   * @override
   */
  renderTitle() {
    const typeName = TYPENAMEMAP[this.props.timelineType]

    if(this.isCompoundTimeline()) {
      return `結合${typeName}`
    } else {
      const {account} = this.state

      if(!account) {
        return typeName
      }

      return (
        <h1 className="column-headerTitle">
          <div className="column-headerTitleSub">{account.account}</div>
          <div className="column-headerTitleMain">{typeName}</div>
        </h1>
      )
    }
  }

  /**
   * @override
   */
  renderBody() {
    if(this.state.loading) {
      return <NowLoading />
    }

    const {timeline} = this.state

    return (
      <ul className="timeline">
        {timeline.map((entry) => (
          <li key={entry.uri}><Status entry={entry} /></li>
        ))}
      </ul>
    )
  }

  /**
   * @override
   */
  getStateFromContext() {
    const state = super.getStateFromContext()

    if(!this.isCompoundTimeline()) {
      const ta = state.accountsState.getAccountByAddress(this.props.subject)

      state.token = ta.token
      state.account = ta.account
    }

    return state
  }

  isCompoundTimeline() {
    return this.props.subject === COMPOUND_TIMELINE
  }

  // callbacks
  onChangeTimeline() {
    this.setState({
      loading: false,
      timeline: this.listener.timeline.map((e) => new UITimelineEntry(e)),
    })
  }
}


class UITimelineEntry {
  constructor(entry) {
    this.entry = entry
    this.isSpoilerOpen = false
  }

  get mainStatus() {
    const status = this.entry.status
    if(status.reblog)
      return status.reblog
    return status
  }

  isReblogged() {
    return this.entry.status.reblog ? true : false
  }

  /*
   * ReblogしたUser
   */
  get rebloggedUser() {
    return this.isReblogged() ? this.entry.status.account : null
  }

  get uri() {
    return this.entry.status.uri
  }

  isDecrypted() {
    return this.entry.decryptedText ? true : false
  }

  get content() {
    return this.isDecrypted() ? this.entry.decryptedText.content : this.mainStatus.rawContent
  }

  get spoilerText() {
    return this.isDecrypted() ? this.entry.decryptedText.spoilerText : this.mainStatus.spoiler_text
  }

  get hasSpoilerText() {
    return this.mainStatus.spoiler_text ? true : false
  }

  /**
   * contentを表示してよいか?
   * @return {bool}
   */
  isContentOpen() {
    if(this.hasSpoilerText && !this.isSpoilerOpen)
      return false
    return true
  }
}


class Status extends React.Component {
  static propTypes = {
    entry: PropTypes.instanceOf(UITimelineEntry).isRequired,
  }

  render() {
    const {entry} = this.props
    const status = entry.mainStatus
    const account = status.account

    return (
      <div className="status timeline-status">

        {entry.isReblogged() && (
          <div className="status-reblogFrom">
            {entry.rebloggedUser.display_name} さんがブーストしました
          </div>
        )}

        <img className="status-avatar" src={account.avatar} />
        <div className="status-info">
          <span className="user-displayName">{account.display_name || account.username}</span>
          <span className="user-account">{account.account}</span>
          <a className="status-createdAt"
             href={status.url}
             target="_blank"
             alt={status.created_at}>{status.createdAt.fromNow()}
          </a>
        </div>

        <div className="status-body">
          {entry.isDecrypted() &&
            <div className="status-isDecrypted"><span className="icon-lock" /> このメッセージは暗号化されています</div>}
          {entry.hasSpoilerText && this.renderSpoilerText()}
          {entry.isContentOpen() && <div className="status-content" dangerouslySetInnerHTML={{__html: entry.content}} />}
        </div>

      </div>
    )
  }

  renderSpoilerText() {
    const {entry} = this.props

    if(!entry.hasSpoilerText)
      return null

    return (
      <div className="status-spoilerText">
        <p>{entry.spoilerText}</p>
        {entry.isSpoilerOpen ? <a>閉じる</a> : <a>もっと見る...</a>}
      </div>
    )
  }
}
