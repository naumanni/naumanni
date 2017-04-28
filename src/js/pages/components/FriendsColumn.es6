// import update from 'immutability-helper'
import PropTypes from 'prop-types'
import React from 'react'

import {SUBJECT_MIXED, COLUMN_TALK} from 'src/constants'
import AddColumnUseCase from 'src/usecases/AddColumnUseCase'
import Column from './Column'
import {IconFont, UserIconWithHost} from '../parts'


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

    this.listenerRemovers.push(
      this.listener.onChange(::this.onChangeFriends),
    )

    // make event listener
    const ta = this.state.accountsState.getAccountByAddress(this.props.subject)
    this.listener.open(ta || {token: null, account: null})
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

    const ta = this.state.accountsState.getAccountByAddress(this.props.subject)
    this.listener.updateTokenAndAccount(ta || {token: null, account: null})
  }

  // cb
  onChangeFriends() {
    this.setState({
      friends: this.listener.state.friends,
      loading: false,
    })
  }

  onClickFriend(friend) {
    const {context} = this.context

    context.useCase(new AddColumnUseCase()).execute(COLUMN_TALK, {
      to: friend.account.address,
      from: this.props.subject,
    })
  }
}


class FriendRow extends React.Component {
  /**
   * @override
   */
  render() {
    const {account} = this.props.friend

    return (
      <article className="friend" onClick={() => this.props.onClickFriend(this.props.friend)}>
        <div className="friend-avatar">
          <UserIconWithHost account={account} />
        </div>
        <div className="friend-info">
          <div className="friend-author">
            {account.hasPublicKey && <span className="user-hasPulbickey"><IconFont iconName="key" /></span>}

            <span className="user-displayName">{account.display_name || account.username}</span>
            <span className="user-account">@{account.account}</span>
          </div>

          <div className="friend-note" dangerouslySetInnerHTML={{__html: account.note}} />

        </div>
      </article>
    )
  }
}


//
import {EventEmitter} from 'events'


class UIFriend {
  constructor(account) {
    this.account = account
  }

  get key() {
    return this.account.address
  }
}


/**
 * とりまゴリゴリ書いてみる
 */
class FriendsListener extends EventEmitter {
  static EVENT_CHANGE = 'EVENT_CHANGE'

  constructor(subject) {
    super()
    this.subject = subject
  }

  open({token, account}) {
    this.token = token
    this.account = account
    this.state = {
      friends: null,
    }
    this.refresh()
  }

  updateTokenAndAccount({token, account}) {
    // if(this.token && this.token.address === token.address) {
    //   this.account = account
    //   return
    // }

    this.token = token
    this.account = account
    this.refresh()
  }

  async refresh() {
    if(!this.token || !this.account)
      return

    const {requester} = this.token
    const response = await Promise.all([
      requester.listFollowings({id: this.account.id, limit: 80}),
      requester.listFollowers({id: this.account.id, limit: 80}),
    ])

    const friends = []
    const keys = new Set()

    response.forEach((accounts) => accounts.forEach((account) => {
      if(keys.has(account.address))
        return

      friends.push(new UIFriend(account))
      keys.add(account.address)
    }))

    // TODO: 最近お話した順でソートしたいね

    this.state.friends = friends
    this.emitChange()
  }

  onChange(cb) {
    this.on(this.EVENT_CHANGE, cb)
    return this.removeListener.bind(this, this.EVENT_CHANGE, cb)
  }

  emitChange() {
    this.emit(this.EVENT_CHANGE, [this])
  }
}
