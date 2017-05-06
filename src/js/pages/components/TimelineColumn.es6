// import update from 'immutability-helper'
import PropTypes from 'prop-types'
import React from 'react'


import {
  TIMELINE_FEDERATION, TIMELINE_LOCAL, TIMELINE_HOME, SUBJECT_MIXED,
} from 'src/constants'
import TimelineListener from 'src/controllers/TimelineListener'
import TimelineStatus from './TimelineStatus'
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
    this.listener.updateTokens(this.state.accountsState.tokens)

    // set timer for update dates
    this.timer = setInterval(
      () => this.setState({tick: (new Date())}),
      30 * 1000)
  }

  /**
   * @override
   */
  componentWillUnmount() {
    super.componentWillUnmount()

    clearInterval(this.timer)
  }

  /**
   * @override
   */
  renderTitle() {
    const typeName = TYPENAMEMAP[this.props.timelineType]

    if(this.isMixedTimeline()) {
      return `統合${typeName}`
    } else {
      const {token} = this.state

      if(!token)
        return typeName

      return (
        <h1 className="column-headerTitle">
          <div className="column-headerTitleSub">{token.acct}</div>
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
    const {tokens} = this.state.accountsState

    return (
      <ul className="timeline">
        {timeline.map((status) => (
          <li key={status.uri}>
            <TimelineStatus
              status={status}
              tokens={tokens}
              onSendReply={this.onSendReply.bind(this, status)} />
          </li>
        ))}
      </ul>
    )
  }

  /**
   * @override
   */
  getStateFromContext() {
    const state = super.getStateFromContext()
    if(!this.isMixedTimeline()) {
      // ヘッダに表示するために自分のTokenを保存している
      state.token = state.accountsState.getTokenByAcct(this.props.subject)
    }
    return state
  }


  isMixedTimeline() {
    return this.props.subject === SUBJECT_MIXED
  }

  onChangeConext() {
    super.onChangeConext()
    this.listener.updateTokens(this.state.accountsState.tokens)
  }

  // callbacks
  onChangeTimeline() {
    this.setState({
      loading: false,
      timeline: this.listener.timeline,
    })
  }

  async onSendReply(status, {sendFrom, message}) {
    // とりまこっから送る
    const responses = await Promise.all(
      sendFrom.map(async (token) => {
        // in_reply_to_id を付加する
        // 同Hostにしか付加できない
        if(status.hosts.indexOf(token.host) >= 0) {
          // TODO: tootpanelの方にwarning出す?
          message.in_reply_to_id = status.id
        }
        return await token.requester.postStatus(message)
      })
    )
  }
}
