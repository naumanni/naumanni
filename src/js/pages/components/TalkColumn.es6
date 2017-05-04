// import update from 'immutability-helper'
import PropTypes from 'prop-types'
import React from 'react'

import {
  SUBJECT_MIXED, COLUMN_TALK, NOTIFICATION_TYPE_MENTION, VISIBLITY_DIRECT,
  KEY_ENTER} from 'src/constants'
import Column from './Column'
import {IconFont, UserIconWithHost} from '../parts'
import SendDirectMessageUseCase from 'src/usecases/SendDirectMessageUseCase'
import TalkListener from 'src/controllers/TalkListener'


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
    this.state.loading = true
    this.state.newMessage = ''
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
    this.listener.updateTokenAndAccount(this.state)
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
    const {fromAccount, toAccount} = this.state

    if(!toAccount || !fromAccount) {
      return 'トーク'
    }

    return (
      <h1 className="column-headerTitle">
        <div className="column-headerTitleSub">{fromAccount.account}</div>
        <div className="column-headerTitleMain">{toAccount.display_name || toAccount.acct}とトーク</div>
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
        <ul className="talk-speaks">
          {(talk || []).map((statusGroup) => this.renderStatusGroup(statusGroup))}
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
    const ta = state.accountsState.getAccountByAddress(this.props.from)

    state.token = ta && ta.token
    state.account = ta && ta.account

    return state
  }

  /**
   * @override
   */
  onChangeConext() {
    super.onChangeConext()

    this.listener.updateTokenAndAccount(this.state)
  }

  renderStatusGroup(statusGroup) {
    const {speaker, statuses} = statusGroup
    const isReceiver = speaker.address == this.state.fromAccount.address
    const key = `speak-${speaker.address}-${statuses[0].status.id}`

    return (
      <div className={`talk-speak ${isReceiver ? 'is-receiver' : 'is-sender'}`} key={key}>
        {isReceiver && (
          <div className="talk-speaker">
            <UserIconWithHost account={speaker} />
          </div>
        )}
        <ul className="talk-speakStatuses">
          {statuses.map((entry) => {
            const {status} = entry
            return (
              <div key={status.id} className="status-content" dangerouslySetInnerHTML={{__html: status.content}} />
            )
          })}
        </ul>
      </div>
    )
  }

  // cb
  onChangeTalk() {
    this.setState({
      toAccount: this.listener.toAccount,
      talk: this.listener.talk,
      loading: this.listener.talk === null ? true : false,
    })
  }

  onChangeMessage(e) {
    this.setState({newMessage: e.target.value})
  }

  onKeyDownMessage(e) {
    const message = this.state.newMessage.trim()
    if(e.shiftKey && e.keyCode == KEY_ENTER && message.length) {
      console.log('send message', message)

      e.preventDefault()

      const {context} = this.context
      context.useCase(new SendDirectMessageUseCase()).execute(
        this.state.token, message, this.state.toAccount)

      this.setState({
        newMessage: '',
      }, () => {
        console.log(this.state)
      })
    }
  }
}
