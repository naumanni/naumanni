// import update from 'immutability-helper'
import PropTypes from 'prop-types'
import React from 'react'


import {
  TIMELINE_FEDERATION, TIMELINE_LOCAL, TIMELINE_HOME, SUBJECT_MIXED,
} from 'src/constants'
import TimelineListener from 'src/controllers/TimelineListener'
import TimelineStatus from '../components/TimelineStatus'
import TimelineData, {postStatusManaged} from 'src/infra/TimelineData'
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
    if(this.state.loading) {
      return <NowLoading />
    }

    const {timeline} = this.state
    const {tokens} = this.state.tokenState

    return (
      <ul className="timeline">
        {timeline.map((statusRef) => {
          return (
            <li key={statusRef.uri}>
              <TimelineStatus
                {...statusRef.expand()}
                tokens={tokens}
                onSendReply={this.onSendReply.bind(this, statusRef)}
                onReblogStatus={::this.onReblogStatus}
                onFavouriteStatus={::this.onFavouriteStatus}
              />
            </li>
          )
        })}
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
      return changes.statuses[statusRef.uri] || changes.accounts[statusRef.account.uri]
    }) ? true : false

    // Timelineを更新
    if(changed) {
      this.setState({timeline: this.state.timeline})
    }
  }

  async onSendReply(status, sendFrom, messageContent) {
    // とりまこっから送る
    await Promise.all(
      sendFrom.map(async (token) => {
        // in_reply_to_id を付加する
        messageContent.message.in_reply_to_id = status.getInReplyToIdByHost(token.host)
        // TODO: tootpanelの方にwarning出す?
        return await postStatusManaged(token, messageContent)
      })
    )
  }

  async onReblogStatus(token, status, toReblog) {
    const api = toReblog ? 'reblogStatus' : 'unreblogStatus'
    const {entities, result} = await token.requester[api]({
      id: status.getIdByHost(token.host),
    }, {token})
    return TimelineData.mergeStatuses(entities, [result])[0]
  }

  async onFavouriteStatus(token, status, toFav) {
    const api = toFav ? 'favouriteStatus' : 'unfavouriteStatus'
    const {entities, result} = await token.requester[api]({
      id: status.getIdByHost(token.host),
    }, {token})
    return TimelineData.mergeStatuses(entities, [result])[0]
  }
}
