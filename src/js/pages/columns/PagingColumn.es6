import PropTypes from 'prop-types'
import React from 'react'
import {findDOMNode} from 'react-dom'

import {
  COLUMN_TIMELINE,
  TIMELINE_FEDERATION, TIMELINE_LOCAL, TIMELINE_HOME, SUBJECT_MIXED,
  STREAM_HOME, STREAM_LOCAL, STREAM_FEDERATION,
  AUTO_PAGING_MARGIN, MAX_STATUSES,
} from 'src/constants'
import TimelineData from 'src/infra/TimelineData'
import TimelineActions from 'src/controllers/TimelineActions'
import TokenListener from 'src/controllers/TokenListener'
import {NowLoading} from 'src/pages/parts'
import {RefCounter} from 'src/utils'
import Column from './Column'


/**
 * AutoPagingするカラム
 */
export default class PagingColumn extends Column {
  static propTypes = {
    subject: PropTypes.string.isRequired,
  }

  constructor(...args) {
    super(...args)

    const {subject} = this.props

    this.db = TimelineData
    this.scrollLockCounter = new RefCounter({
      onLocked: ::this.onLocked,
      onUnlocked: ::this.onUnlocked,
    })
    this.timeline = new this.timelineClass(MAX_STATUSES)  // eslint-disable-line new-cap
    this.tokenListener = new TokenListener(subject, {
      onTokenAdded: ::this.onTokenAdded,
      onTokenRemoved: ::this.onTokenRemoved,
      onTokenUpdated: ::this.onTokenUpdated,
    })
    this.timelineListener = new this.listenerClass(this.timeline, this.db)  // eslint-disable-line new-cap
    this.timelineLoaders = null
    this.actionDelegate = new TimelineActions(this.context)
    this.unlockScrollLock = null

    this.state = {
      ...this.state,
      loading: true,
      isScrollLocked: false,
    }
  }

  /**
   * @override
   */
  componentDidMount() {
    super.componentDidMount()
    this.listenerRemovers.push(
      this.timeline.onChange(::this.onTimelineChanged),
      this.db.registerTimeline(this.timeline),
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

    if(this.subtimeline)
      this.db.decrement(this.subtimeline.uris)
    if(this.timeline)
      this.db.decrement(this.timeline.uris)

    this.subtimlineChangedRemover && this.subtimlineChangedRemover()
    this.timelineListener.clean()
    clearInterval(this.timer)
  }


  /**
   * @override
   */
  renderBody() {
    const {timeline, tailLoading} = this.state

    return (
      <div className={this.columnBodyClassName()}>
        <ul className="timeline" onScroll={::this.onTimelineScrolled} ref="timeline">
          {timeline.map((ref) => this.renderTimelineRow(ref))}
          {tailLoading && <li className="timeline-loading"><NowLoading /></li>}
        </ul>
      </div>
    )
  }

  /**
   * @override
   */
  onChangeConext(changingStores) {
    super.onChangeConext(changingStores)

    // なんだかなあ
    const {tokenState} = this.context.context.getState()
    this.tokenListener.updateTokens(tokenState.tokens)

    if(!this.isMixedTimeline()) {
      this.setState({token: tokenState.getTokenByAcct(this.props.subject)})
    }
  }

  /**
   * @override
   */
  scrollNode() {
    return findDOMNode(this.refs.timeline)
  }

  loadMoreStatuses() {
    require('assert')(this.subtimeline)

    if(!this.timelineLoaders) {
      this.timelineLoaders = {}
      for(const token of this.tokenListener.getTokens()) {
        this.timelineLoaders[token.address] = {
          loader: this.makeLoaderForToken(this.subtimeline, token),
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
          }, (...args) => {
            console.log('loadNext failed: ', args)
            loaderInfo.loading = false
            this.updateLoadingStatus()
          })
      }
    }
    this.updateLoadingStatus()
  }

  isMixedTimeline() {
    return this.props.subject === SUBJECT_MIXED
  }

  updateLoadingStatus() {
    this.setState({
      isTailLoading: !Object.values(this.timelineLoaders).every((loaderInfo) => !loaderInfo.loading),
    })
  }

  // virtual methods
  renderTimelineRow(ref) {
    require('assert')(0, 'not implemented')
  }

  get timelineClass() {
    require('assert')(0, 'not implemented')
  }

  get listenerClass() {
    require('assert')(0, 'not implemented')
  }

  makeLoaderForToken(timeline, token) {
    require('assert')(0, 'not implemented')
  }


  // callbacks
  // scrollLockCounter callbacks
  onLocked() {
    this.subtimeline = this.timeline.clone()
    this.subtimeline.max = undefined
    this.subtimlineChangedRemover = this.subtimeline.onChange(::this.onSubtimelineChanged)
    this.db.registerTimeline(this.subtimeline)
    this.db.increment(this.subtimeline.uris)

    this.setState({
      isScrollLocked: true,
      timeline: this.subtimeline.timeline,
    })
  }

  onUnlocked() {
    this.db.decrement(this.subtimeline.uris)
    this.db.unregisterTimeline(this.subtimeline)
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
      // console.log('main', this.timeline.timeline.size)
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
    this.makeLoaderForToken(this.timeline, newToken).loadInitial()

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
}
