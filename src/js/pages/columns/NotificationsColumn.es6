// import update from 'immutability-helper'
import PropTypes from 'prop-types'
import React from 'react'

import {
  COLUMN_NOTIFICATIONS, SUBJECT_MIXED, MAX_STATUSES, AUTO_PAGING_MARGIN,
} from 'src/constants'
import {NotificationTimeline} from 'src/models/Timeline'
import NotificationListener from 'src/controllers/NotificationListener'
import TimelineData from 'src/infra/TimelineData'
import TimelineNotification from 'src/pages/components/TimelineNotification'
import TimelineActions from 'src/controllers/TimelineActions'
import TokenListener from 'src/controllers/TokenListener'
import {NotificationTimelineLoader} from 'src/controllers/TimelineLoader'
import {RefCounter} from 'src/utils'
import Column from './Column'
import {NowLoading} from 'src/pages/parts'

/**
 * 通知カラム
 * TODO: TimelineColumnとのコピペなのを何とかする
 */
export default class NotificationColumn extends Column {
  static propTypes = {
    subject: PropTypes.string.isRequired,
  }

  constructor(...args) {
    super(...args)

    const {subject} = this.props

    this.db = TimelineData
    this.timeline = new NotificationTimeline(MAX_STATUSES)
    this.scrollLockCounter = new RefCounter({
      onLocked: ::this.onLocked,
      onUnlocked: ::this.onUnlocked,
    })
    this.tokenListener = new TokenListener(subject, {
      onTokenAdded: ::this.onTokenAdded,
      onTokenRemoved: ::this.onTokenRemoved,
      onTokenUpdated: ::this.onTokenUpdated,
    })
    this.timelineListener = new NotificationListener(this.timeline, this.db)
    this.actionDelegate = new TimelineActions(this.context)
  }

  /**
   * @override
   */
  componentDidMount() {
    super.componentDidMount()
    this.listenerRemovers.push(
      this.timeline.onChange(::this.onTimelineChanged),
    )

    // make event listener
    this.tokenListener.updateTokens(this.state.tokenState.tokens)

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
    this.subtimlineChangedRemover && this.subtimlineChangedRemover()
    this.timelineListener.clean()
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
    const {timeline, tailLoading} = this.state
    const {tokens} = this.state.tokenState

    return (
      <div className={this.columnBodyClassName()}>
        <ul className="timeline" onScroll={::this.onTimelineScrolled}>
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
          {tailLoading && <li className="timeline-loading"><NowLoading /></li>}
        </ul>
      </div>
    )
  }

  /**
   * @override
   */
  onChangeConext() {
    super.onChangeConext()

    // なんだかなあ
    this.tokenListener.updateTokens(this.context.context.getState().tokenState.tokens)
  }

  isMixedTimeline() {
    return this.props.subject === SUBJECT_MIXED
  }

  loadMoreStatuses() {
    require('assert')(this.subtimeline)

    if(!this.timelineLoaders) {
      this.timelineLoaders = {}
      for(const token of this.tokenListener.getTokens()) {
        this.timelineLoaders[token.address] = {
          loader: new NotificationTimelineLoader(this.subtimeline, token, this.db),
          loading: false,
        }
      }
    }

    for(const loaderInfo of Object.values(this.timelineLoaders)) {
      if(!loaderInfo.loading && !loaderInfo.loader.isTailReached()) {
        loaderInfo.loading = true
        loaderInfo.loader.loadNext()
          .then(() => {
            loaderInfo.loading = false
            this.updateLoadingStatus()
          }, () => {
            loaderInfo.loading = false
            this.updateLoadingStatus()
          })
      }
    }
    this.updateLoadingStatus()
  }

  // callbacks
  // scrollLockCounter callbacks
  onLocked() {
    this.subtimeline = this.timeline.clone()
    this.subtimeline.max = undefined
    this.subtimlineChangedRemover = this.subtimeline.onChange(::this.onSubtimelineChanged)

    this.setState({
      isScrollLocked: true,
      timeline: this.subtimeline.timeline,
    })
  }

  onUnlocked() {
    this.subtimeline = null
    this.timelineLoaders = null
    this.subtimlineChangedRemover()
    this.subtimlineChangedRemover = null

    this.setState({
      isScrollLocked: false,
      timeline: this.timeline.timeline,
    })
  }

  /**
   * Timelineが更新されたら呼ばれる
   */
  onTimelineChanged() {
    if(this.state.isScrollLocked) {
      // スクロールがLockされていたらメインTimelineは更新しない
      // this.setState({
      //   loading: false,
      //   newTimeline: this.timeline,
      // })
    } else {
      // スクロールは自由なのでメインTimelineを直接更新する
      this.setState({
        loading: false,
        timeline: this.timeline.timeline,
      })
    }
  }

  onSubtimelineChanged() {
    // load中にlock解除されたら、ここはnull
    if(!this.subtimeline)
      return
    this.setState({
      loading: false,
      timeline: this.subtimeline.timeline,
    })
  }


  // TokenListener callbacks
  onTokenAdded(newToken) {
    // install listener
    this.timelineListener.addListener(newToken.acct, newToken)

    // load timeline
    const loader = new NotificationTimelineLoader(this.timeline, newToken, this.db)
    loader.loadInitial()

    // TODO: なんだかなぁ
    if(this.isMixedTimeline())
      this.setState({token: this.tokenListener.getSubjectToken()})
  }

  onTokenRemoved(oldToken) {
    // remove listener
    this.timelineListener.removeListener(oldToken.acct)

    // TODO: remove statuses

    // TODO: なんだかなぁ
    if(this.isMixedTimeline())
      this.setState({token: this.tokenListener.getSubjectToken()})
  }

  onTokenUpdated(newToken, oldToken) {
    // update listener
    const {acct} = newToken

    this.timelineListener.removeListener(acct)
    this.timelineListener.addListener(acct, newToken)

    // TODO: なんだかなぁ
    if(this.isMixedTimeline())
      this.setState({token: this.tokenListener.getSubjectToken()})
  }

  // dom events
  /**
   * Timelineがスクロールしたら呼ばれる。Lockとかを管理
   * @param {Event} e
   */
  onTimelineScrolled(e) {
    const node = e.target
    const scrollTop = node.scrollTop

    // Scroll位置がちょっとでもTopから動いたらLockしちゃう
    if(!this.unlockScrollLock && scrollTop > 0) {
      // Scrollが上部以外になったのでScrollをLockする
      require('assert')(!this.unlockScrollLock)
      this.unlockScrollLock = this.scrollLockCounter.increment()
    } else if(this.unlockScrollLock && scrollTop <= 0) {
      // Scrollが上部になったのでScrollをUnlockする
      this.unlockScrollLock()
      this.unlockScrollLock = undefined
    }

    // Scroll位置がBottomまであとちょっとになれば、次を読み込む
    if(scrollTop + node.clientHeight > node.scrollHeight - AUTO_PAGING_MARGIN) {
      //
      if(!this.state.tailLoading) {
        this.loadMoreStatuses()
      }
    }
  }

  updateLoadingStatus() {
    this.setState({
      isTailLoading: !Object.values(this.timelineLoaders).every((loaderInfo) => !loaderInfo.loading),
    })
  }
}
require('./').registerColumn(COLUMN_NOTIFICATIONS, NotificationColumn)
