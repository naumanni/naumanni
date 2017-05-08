// import update from 'immutability-helper'
import PropTypes from 'prop-types'
import React from 'react'

import {
  SUBJECT_MIXED, COLUMN_TALK, NOTIFICATION_TYPE_MENTION, VISIBLITY_DIRECT,
  KEY_ENTER} from 'src/constants'
import SendDirectMessageUseCase from 'src/usecases/SendDirectMessageUseCase'
import TalkListener from 'src/controllers/TalkListener'
import Column from './Column'
import {IconFont, UserIconWithHost} from './parts'


/**
 * タイムラインのカラム
 */
export default class TalkColumn extends Column {
  static propTypes = {
    to: PropTypes.string.isRequired,
    from: PropTypes.string.isRequired,
  }

  constructor(...args) {
    // mixed timeline not allowed
    require('assert')(args[0].subject !== SUBJECT_MIXED)
    super(...args)

    this.listener = new TalkListener([this.props.to])
    // コードからスクロール量を変更している場合はtrue
    this.scrollChanging = false
    this.state = {
      ...this.state,
      loading: true,
      sendingMessage: false,
      newMessage: '',
      keepAtBottom: true,
    }
  }

  /**
   * @override
   */
  componentDidMount() {
    super.componentDidMount()

    this.listenerRemovers.push(
      this.listener.onChange(::this.onChangeTalk),
    )

    // make event listener
    this.listener.updateToken(this.state.token)
  }

  /**
   * @override
   */
  componentWillUnmount() {
    super.componentWillUnmount()

    clearInterval(this.timer)
    this.listener.close()
    delete this.listener
  }

  /**
   * @override
   */
  componentDidUpdate(prevProps, prevState) {
    if(this.state.keepAtBottom) {
      const node = this.refs.talkGroups
      if(node) {
        this.scrollChanging = true
        node.scrollTop = node.scrollHeight
      }
    }
  }

  /**
   * @override
   */
  renderTitle() {
    const {me, members} = this.state

    if(!me || !members) {
      return 'トーク'
    }

    const memberNames = Object.values(members).map((a) => a.display_name || a.acct)

    return (
      <h1 className="column-headerTitle">
        <div className="column-headerTitleSub">{me.acct}</div>
        <div className="column-headerTitleMain">{memberNames}とトーク</div>
      </h1>
    )
  }

  /**
   * @override
   */
  renderBody() {
    if(this.state.loading) {
      return <NowLoading />
    }

    const {talk} = this.state

    return (
      <div className="talk">
        <ul className="talk-talkGroups" ref="talkGroups" onScroll={::this.onScrollTalkGroups}>
          {(talk || []).map((talkGroup, idx, talk) => this.renderTalkGroup(talkGroup, talk[idx - 1], talk[idx + 1]))}
        </ul>
        <div className="talk-form">
          <textarea
            value={this.state.newMessage}
            onChange={::this.onChangeMessage}
            onKeyDown={::this.onKeyDownMessage}
            placeholder="なんか入力してShift+Enter" />
        </div>
      </div>
    )
  }

  /**
   * @override
   */
  getStateFromContext() {
    const state = super.getStateFromContext()
    state.token = state.tokenState.getTokenByAcct(this.props.from)
    return state
  }

  /**
   * @override
   */
  onChangeConext() {
    super.onChangeConext()

    this.listener.updateToken(this.state.token)
  }

  renderTalkGroup(talkGroup, prevTalkGroup, nextTalkGroup) {
    const isMyTalk = talkGroup.account.isEqual(this.state.me)
    // memberのtalkgroupは、前のTalkGroupが自分であれば名前を表示しない
    const showName = !isMyTalk && !(prevTalkGroup && prevTalkGroup.account.isEqual(talkGroup.account))
    // memberのtalkgroupは、次のTalkGroupが自分であればアバターを表示しない
    const showAvatar = !isMyTalk && !(nextTalkGroup && nextTalkGroup.account.isEqual(talkGroup.account))

    const key = `speak-${talkGroup.account.acct}-${talkGroup.statuses[0].uri}`

    return (
      <div className={`talk-talkGroup ${isMyTalk ? 'is-me' : 'is-member'}`} key={key}>
        {showName && (
          <div className="talk-speakerName">
            {talkGroup.account.display_name || talkGroup.account.account}
          </div>
        )}
        {showAvatar && (
          <div className="talk-speakerAvatar">
            <UserIconWithHost account={talkGroup.account} />
          </div>
        )}
        <ul className="talk-talkGroupStatuses">
          {talkGroup.statuses.map((status) => {
            return (
              <li key={status.uri}>
                <div className="status-content" dangerouslySetInnerHTML={{__html: status.content}} />
                <div className="status-date">{status.createdAt.format('YYYY-MM-DD HH:mm:ss')}</div>
              </li>
            )
          })}
        </ul>
      </div>
    )
  }

  sendMessage() {
    const message = this.state.newMessage.trim()
    console.log('send message', message)

    this.setState({sendingMessage: true}, async () => {
      const {context} = this.context
      const {token, me, members} = this.state

      try {
        await context.useCase(new SendDirectMessageUseCase()).execute({
          token,
          self: me,
          message: message,
          recipients: Object.values(members),
        })

        this.setState({
          newMessage: '',
          sendingMessage: false,
        })
      } catch(e) {
        console.dir(e)
        this.setState({sendingMessage: false})
      }
    })
  }

  // cb
  onChangeTalk() {
    const {me, members, talk} = this.listener

    this.setState({
      me,
      members,
      talk,
      loading: this.listener.isLoading(),
    })
  }

  onScrollTalkGroups(e) {
    // コードから変更された場合は何もしない
    if(this.scrollChanging) {
      this.scrollChanging = false
      return
    }

    const node = e.target
    const atBottom = node.scrollTop + node.clientHeight >= node.scrollHeight ? true : false

    if(!atBottom && this.state.keepAtBottom)
      this.setState({keepAtBottom: false})
    else if(atBottom && !this.state.keepAtBottom)
      this.setState({keepAtBottom: true})
  }

  onChangeMessage(e) {
    this.setState({newMessage: e.target.value})
  }

  onKeyDownMessage(e) {
    require('assert')(!this.state.loading)

    if(e.shiftKey && e.keyCode == KEY_ENTER) {
      e.preventDefault()
      this.sendMessage()
    }
  }
}
