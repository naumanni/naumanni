// import update from 'immutability-helper'
import PropTypes from 'prop-types'
import React from 'react'

import {
  COLUMN_NOTIFICATIONS,
  SUBJECT_MIXED,
} from 'src/constants'
import NotificationListener from 'src/controllers/NotificationListener'
import TimelineData from 'src/infra/TimelineData'
import TimelineNotification from 'src/pages/components/TimelineNotification'
import TimelineActions from 'src/controllers/TimelineActions'
import Column from './Column'


/**
 * 通知カラム
 */
export default class NotificationColumn extends Column {
  static isScrollable = true

  static propTypes = {
    subject: PropTypes.string.isRequired,
  }

  constructor(...args) {
    super(...args)

    const {subject} = this.props

    this.listener = new NotificationListener(subject)
    this.state.timeline = null
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
    if(this.isMixedTimeline()) {
      return '統合通知'
    } else {
      const {token} = this.state

      if(!token)
        return '通知'

      return (
        <h1 className="column-headerTitle">
          <div className="column-headerTitleSub">{token.acct}</div>
          <div className="column-headerTitleMain">通知</div>
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
          {(timeline || []).map((notificationRef) => {
            return (
              <li key={notificationRef.uri}>
                <TimelineNotification
                  subject={subject !== SUBJECT_MIXED ? subject : null}
                  notificationRef={notificationRef}
                  tokens={tokens}
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
    const changed = (this.state.timeline || []).find((notificationRef) => {
      if(notificationRef.statusRef && changes.statuses[notificationRef.statusRef.uri])
        return true
      if(notificationRef.accountRef && changes.accounts[notificationRef.accountRef.uri])
        return true
    }) ? true : false

    // Timelineを更新
    if(changed) {
      this.setState({timeline: this.state.timeline})
    }
  }
}
require('./').registerColumn(COLUMN_NOTIFICATIONS, NotificationColumn)
