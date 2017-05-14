// import update from 'immutability-helper'
import PropTypes from 'prop-types'
import React from 'react'
import ReactDOM from 'react-dom'

import {
  COLUMN_TIMELINE,
  TIMELINE_FEDERATION, TIMELINE_LOCAL, TIMELINE_HOME, SUBJECT_MIXED,
  STREAM_HOME, STREAM_LOCAL, STREAM_FEDERATION,
  AUTO_PAGING_MARGIN,
} from 'src/constants'

import TimelineListener from 'src/controllers/TimelineListener'
import TimelineData from 'src/infra/TimelineData'
import Column from './Column'
import TimelineStatus from '../components/TimelineStatus'
import TimelineActions from 'src/controllers/TimelineActions'
import {makeTimelineLoader} from 'src/controllers/TimelineLoader'
import {StatusTimeline} from 'src/models/Timeline'
import ChangeEventEmitter from 'src/utils/EventEmitter'
import {NowLoading} from 'src/pages/parts'


// TODO: i10n
const TYPENAMEMAP = {
  [TIMELINE_FEDERATION]: '連合タイムライン',
  [TIMELINE_LOCAL]: 'ローカルタイムライン',
  [TIMELINE_HOME]: 'ホームタイムライン',
}
const MAX_STATUSES = 20

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

    const {subject} = this.props

    this.db = TimelineData
    this.scrollLockCounter = new RefCounter({
      onLocked: ::this.onLocked,
      onUnlocked: ::this.onUnlocked,
    })
    this.timeline = new StatusTimeline(MAX_STATUSES)
    this.tokenListener = new TokenListener(subject, {
      onTokenAdded: ::this.onTokenAdded,
      onTokenRemoved: ::this.onTokenRemoved,
      onTokenUpdated: ::this.onTokenUpdated,
    })
    this.timelineListener = new TimelineListener(this.timeline, this.db)
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
      // TimelineData.onChange(::this.onChangeTimelineData),
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
  // componentDidUpdate(prevProps, prevState) {
  // }

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
    const {timeline, tailLoading} = this.state
    const {tokens} = this.state.tokenState

    return (
      <div className={this.columnBodyClassName()}>
        <ul className="timeline" ref="timeline" onScroll={::this.onScrollTimeline}>
          {timeline.map((statusRef) => {
            return (
              <li key={statusRef.uri}>
                <TimelineStatus
                  subject={subject !== SUBJECT_MIXED ? subject : null}
                  tokens={tokens}
                  onLockStatus={() => this.scrollLockCounter.increment()}
                  {...statusRef.expand()}
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

  loadMoreStatuses() {
    require('assert')(this.subtimeline)

    if(!this.timelineLoaders) {
      this.timelineLoaders = {}
      for(const token of this.tokenListener.getTokens()) {
        this.timelineLoaders[token.address] = {
          loader: makeTimelineLoader(this.props.timelineType, this.subtimeline, token, this.db),
          loading: false,
        }
      }
    }

    const _isTailLoading = () => {
      return !Object.values(this.timelineLoaders)
        .every((loaderInfo) => !loaderInfo.loading)
    }

    for(const loaderInfo of Object.values(this.timelineLoaders)) {
      if(!loaderInfo.loading && !loaderInfo.loader.isTailReached()) {
        loaderInfo.loading = true
        loaderInfo.loader.loadNext()
          .then(() => {
            loaderInfo.loading = false
            this.setState({tailLoading: _isTailLoading()})
          })
      }
    }
    this.setState({tailLoading: _isTailLoading()})
  }

  isMixedTimeline() {
    return this.props.subject === SUBJECT_MIXED
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
      console.log('main', this.timeline.timeline.size)
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
    const {timelineType} = this.props

    // install listener
    const websocketUrl = makeWebsocketUrlByTimelineType(timelineType, newToken)
    this.timelineListener.addListener(newToken.acct, newToken, websocketUrl)

    // load timeline
    makeTimelineLoader(timelineType, this.timeline, newToken, this.db).loadInitial()

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
    const {timelineType} = this.props
    const {acct} = newToken
    const websocketUrl = makeWebsocketUrlByTimelineType(timelineType, newToken)

    this.timelineListener.removeListener(acct)
    this.timelineListener.addListener(acct, newToken, websocketUrl)

    // TODO: なんだかなぁ
    if(this.isMixedTimeline())
      this.setState({token: this.tokenListener.getSubjectToken()})
  }

  // dom events
  /**
   * Timelineがスクロールしたら呼ばれる。Lockとかを管理
   * @param {Event} e
   */
  onScrollTimeline(e) {
    // const node = e.target
    const node = ReactDOM.findDOMNode(this.refs.timeline)
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
require('./').registerColumn(COLUMN_TIMELINE, TimelineColumn)


// TODO: どっかに移す
class TokenListener extends ChangeEventEmitter {
  constructor(subject, options={}) {
    super()

    this.subject = subject
    this._tokens = {}
    this.options = options
  }

  updateTokens(tokens) {
    if(this.subject !== SUBJECT_MIXED) {
      // Accountタイムラインなので、一致するアカウントのみ
      tokens = tokens.filter((token) => token.acct === this.subject)
    }
    tokens = tokens.reduce((map, token) => {
      map[token.acct] = token
      return map
    }, {})

    // new tokens
    Object.values(tokens)
      .filter((newToken) => !this._tokens[newToken.acct] || !this._tokens[newToken.acct].isEqual(newToken))
      .forEach((token) => {
        const oldToken = this._tokens[token.acct]
        if(oldToken) {
          // token updated
          if(oldToken.accessToken != token.accessToken)
            this.onTokenUpdated(token, oldToken)
        } else {
          // token added
          this.onTokenAdded(token)
        }
      })

    // disposed tokens
    Object.values(this._tokens)
      .filter((oldToken) => !tokens[oldToken.acct] || !tokens[oldToken.acct].isEqual(oldToken))
      .forEach((token) => {
        if(!tokens[token.acct]) {
          // token removed
          console.log(`token removed ${token.toString()}`)
          this.onTokenRemoved(token)
        }
      })

    this._tokens = tokens
  }

  getSubjectToken() {
    if(this.subject === SUBJECT_MIXED)
      return null
    return this._tokens[this.subject]
  }

  getTokens() {
    return Array.from(Object.values(this._tokens))
  }

  onTokenAdded(newToken) {
    this.options.onTokenAdded && this.options.onTokenAdded(newToken)
  }

  onTokenRemoved(oldToken) {
    this.options.onTokenAdded && this.options.onTokenRemoved(oldToken)
  }

  onTokenUpdated(newToken, oldToken) {
    this.options.onTokenAdded && this.options.onTokenUpdated(newToken, oldToken)
  }
}


//
import {makeWebsocketUrl} from 'src/utils'

function makeWebsocketUrlByTimelineType(timelineType, token) {
  let url

  switch(timelineType) {
  case TIMELINE_HOME:
    url = makeWebsocketUrl(token, STREAM_HOME)
    break

  case TIMELINE_LOCAL:
    url = makeWebsocketUrl(token, STREAM_LOCAL)
    break

  case TIMELINE_FEDERATION:
    url = makeWebsocketUrl(token, STREAM_FEDERATION)
    break
  }
  return url
}


// TODO: あとでうつす
class RefCounter {
  constructor(options={}) {
    this._counter = 0
    this._options = options
    if(WeakSet)
      this.decrementers = new WeakSet()
  }

  get counter() {
    return this._counter
  }

  increment() {
    this._counter += 1
    if(this._counter === 1 && this._options.onLocked)
      this._options.onLocked()

    const decrementer = () => {
      if(this.decrementers && !this.decrementers.has(decrementer)) {
        return false
      }
      this.decrementers && this.decrementers.delete(decrementer)
      this._counter -= 1
      if(this._counter === 0 && this._options.onUnlocked)
        this._options.onUnlocked()

      return true
    }
    this.decrementers && this.decrementers.add(decrementer)
    return decrementer
  }
}
