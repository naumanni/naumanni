// import update from 'immutability-helper'
import PropTypes from 'prop-types'
import React from 'react'

import {SUBJECT_MIXED, COLUMN_TALK} from 'src/constants'
import Column from './Column'
import {IconFont, UserIconWithHost} from '../parts'


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

    this.listener = new TalkListener()
    this.state.loading = true
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
    this.listener.open(this.state)
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
        <div className="column-headerTitleMain">{toAccount.display_name} トーク</div>
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

    const {friends} = this.state

    return (
      <ul className="friends">
        {friends.map((friend) => (
          <li key={friend.key}>
            <FriendRow
              friend={friend}
              onClickFriend={::this.onClickFriend}
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

    const toTA = state.accountsState.getAccountByAddress(this.props.to)
    const fromTA = state.accountsState.getAccountByAddress(this.props.from)

    if(toTA && fromTA) {
      require('assert')(toTA.token.address === fromTA.token.address)
    }

    state.token = (toTA && toTA.token) || (fromTA && fromTA.token)
    state.toAccount = toTA && toTA.account
    state.fromAccount = fromTA && fromTA.account

    return state
  }

  /**
   * @override
   */
  onChangeConext() {
    super.onChangeConext()

    this.listener.updateTokenAndAccount(this.state)
  }

  // cb
  onChangeTalk() {
  }
}


//
import {EventEmitter} from 'events'


// class UIFriend {
//   constructor(account) {
//     this.account = account
//   }

//   get key() {
//     return this.account.address
//   }
// }


/**
 * とりまゴリゴリ書いてみる
 */
class TalkListener extends EventEmitter {
  static EVENT_CHANGE = 'EVENT_CHANGE'

  constructor() {
    super()
    this.token = null
    this.toAccount = null
    this.fromAccount = null
  }

  open({token, toAccount, fromAccount}) {
    this.token = token
    this.toAccount = toAccount
    this.fromAccount = fromAccount
    this.refresh()
  }

  updateTokenAndAccount({token, toAccount, fromAccount}) {
    this.token = token
    this.toAccount = toAccount
    this.fromAccount = fromAccount
    this.refresh()
  }

  async refresh() {
    if(!this.token)
      return

    // 現状 Talkを取るAPIが無い。 notifiationsとかを辿るしかない


    // const {requester} = this.token
    // const response = await Promise.all([
    //   requester.listFollowings({id: this.account.id, limit: 80}),
    //   requester.listFollowers({id: this.account.id, limit: 80}),
    // ])

    // const friends = []
    // const keys = new Set()

    // response.forEach((accounts) => accounts.forEach((account) => {
    //   if(keys.has(account.address))
    //     return

    //   friends.push(new UIFriend(account))
    //   keys.add(account.address)
    // }))

    // // TODO: 最近お話した順でソートしたいね

    // this.state.friends = friends
    // this.emitChange()
  }

  onChange(cb) {
    this.on(this.EVENT_CHANGE, cb)
    return this.removeListener.bind(this, this.EVENT_CHANGE, cb)
  }

  emitChange() {
    this.emit(this.EVENT_CHANGE, [this])
  }
}
