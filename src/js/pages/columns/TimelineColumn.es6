// import update from 'immutability-helper'
import PropTypes from 'prop-types'
import React from 'react'

import {
  COLUMN_TIMELINE,
  TIMELINE_FEDERATION, TIMELINE_LOCAL, TIMELINE_HOME, SUBJECT_MIXED,
} from 'src/constants'
import TimelineListener from 'src/controllers/TimelineListener'
import TimelineData from 'src/infra/TimelineData'
import Column from './Column'
import TimelineStatus from '../components/TimelineStatus'
import TimelineActions from 'src/controllers/TimelineActions'


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
  static isScrollable = true

  static propTypes = {
    subject: PropTypes.string.isRequired,
    timelineType: PropTypes.string.isRequired,
  }

  constructor(...args) {
    super(...args)

    const {subject, timelineType} = this.props

    this.listener = new TimelineListener(subject, timelineType)
    this.state.loading = true
    this.actionDelegate = new TimelineActions(this.context)
  }

  /**
   * @override
   */
  componentDidMount() {
    super.componentDidMount()
    this.listenerRemovers.push(
      this.listener.onChange(::this.onChangeTimeline),
      TimelineData.onChange(::this.onChangeTimelineData),
    )

    // make event listener
    this.listener.updateTokens(this.state.tokenState.tokens)

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
    const {subject} = this.props
    const {timeline} = this.state
    const {tokens} = this.state.tokenState

    return (
      <div className={this.columnBodyClassName()}>
        <ul className="timeline">
          {timeline.map((statusRef) => {
            return (
              <li key={statusRef.uri}>
                <TimelineStatus
                  subject={subject !== SUBJECT_MIXED ? subject : null}
                  tokens={tokens}
                  {...statusRef.expand()}
                  {...this.actionDelegate.props}
                />
              </li>
            )
          })}
        </ul>
      </div>
    )
  }

  /**
   * @override
   */
  getStateFromContext() {
    const state = super.getStateFromContext()
    if(!this.isMixedTimeline()) {
      // ヘッダに表示するために自分のTokenを保存している
      state.token = state.tokenState.getTokenByAcct(this.props.subject)
    }
    return state
  }


  isMixedTimeline() {
    return this.props.subject === SUBJECT_MIXED
  }

  onChangeConext() {
    super.onChangeConext()
    this.listener.updateTokens(this.state.tokenState.tokens)
  }

  // callbacks
  /**
   * ListnerのTimelineが更新されたら呼ばれる
   */
  onChangeTimeline() {
    this.setState({
      loading: false,
      timeline: this.listener.timeline,
    })
  }

  /**
   * TimelineDataのStatus, Accountが更新されたら呼ばれる。
   * TODO: 関数名どうにかして
   * @param {object} changes
   */
  onChangeTimelineData(changes) {
    // 表示中のTimelineに関連があるか調べる
    const changed = (this.state.timeline || []).find((statusRef) => {
      return changes.statuses[statusRef.uri] || changes.accounts[statusRef.accountUri]
    }) ? true : false

    // Timelineを更新
    if(changed) {
      this.setState({timeline: this.state.timeline})
    }
  }
}
require('./').registerColumn(COLUMN_TIMELINE, TimelineColumn)
