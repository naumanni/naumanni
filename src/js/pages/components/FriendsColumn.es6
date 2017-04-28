// import update from 'immutability-helper'
import PropTypes from 'prop-types'
import React from 'react'

import {SUBJECT_MIXED} from 'src/constants'
import Column from './Column'


/**
 * タイムラインのカラム
 */
export default class FriendsColumn extends Column {
  static propTypes = {
    subject: PropTypes.string.isRequired,
  }

  constructor(...args) {
    // mixed timeline not allowed
    require('assert')(args[0].subject !== SUBJECT_MIXED)
    super(...args)

    const {subject} = this.props

    this.listener = new FriendsListener(subject)
    this.state.loading = true
  }

  /**
   * @override
   */
  componentDidMount() {
    super.componentDidMount()

    // this.listenerRemovers.push(
    //   this.listener.onChange(::this.onChangeTimeline),
    // )

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
    const {account} = this.state

    if(!account) {
      return 'メッセージ'
    }

    return (
      <h1 className="column-headerTitle">
        <div className="column-headerTitleSub">{account.account}</div>
        <div className="column-headerTitleMain">メッセージ</div>
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
  }

  /**
   * @override
   */
  getStateFromContext() {
    const state = super.getStateFromContext()
    const ta = state.accountsState.getAccountByAddress(this.props.subject)

    if(ta) {
      state.account = ta.account
    } else {
      state.account = null
    }

    return state
  }

  /**
   * @override
   */
  onChangeConext() {
    super.onChangeConext()
    this.listener.open(this.state.accountsState.tokensAndAccounts)
  }
}


class FriendsListener {
  constructor(subject) {
    this.subject = subject
  }

  open(tokensAndAccounts) {
    this.updateTokens(tokensAndAccounts)
  }

  updateTokens(tokensAndAccounts) {
  }
}
