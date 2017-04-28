// import update from 'immutability-helper'
import PropTypes from 'prop-types'
import React from 'react'


import {
  TIMELINE_FEDERATION, TIMELINE_LOCAL, TIMELINE_HOME, COMPOUND_TIMELINE,
} from 'src/constants'
import TimelineListener from 'src/controllers/TimelineListener'
import {UITimelineEntry} from 'src/models'
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
    this.listener.open(this.state.accountsState.tokensAndAccounts)

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
          <li key={entry.uri}>
            <TimelineStatus
              entry={entry}
              onToggleContentOpen={::this.onStatusToggleContentOpen}
              />
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

    if(!this.isCompoundTimeline()) {
      const ta = state.accountsState.getAccountByAddress(this.props.subject)

      if(ta) {
        state.token = ta.token
        state.account = ta.account
      } else {
        state.token = state.account = null
      }
    }

    return state
  }

  isCompoundTimeline() {
    return this.props.subject === COMPOUND_TIMELINE
  }

  onChangeConext() {
    super.onChangeConext()
    this.listener.open(this.state.accountsState.tokensAndAccounts)
  }

  // callbacks
  onChangeTimeline() {
    this.setState({
      loading: false,
      timeline: this.listener.timeline.map((e) => new UITimelineEntry(e)),
    })
  }

  onStatusToggleContentOpen(entry) {
    const idx = this.state.timeline.indexOf(entry)
    require('assert')(idx >= 0)

    entry.isContentOpen = !entry.isContentOpen
    this.setState({timeline: this.state.timeline})
  }
}
