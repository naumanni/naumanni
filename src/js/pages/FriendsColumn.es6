// import update from 'immutability-helper'
import PropTypes from 'prop-types'
import React from 'react'

import {SUBJECT_MIXED, COLUMN_TALK} from 'src/constants'
import AddColumnUseCase from 'src/usecases/AddColumnUseCase'
import Column from './Column'
import {IconFont, UserIconWithHost} from './parts'


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
    this.state.filter = ''
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
    const token = this.state.tokenState.getTokenByAcct(this.props.subject)
    this.listener.open(token)
  }

  /**
   * @override
   */
  renderTitle() {
    const {token} = this.state

    if(!token) {
      return 'メッセージ'
    }

    return (
      <h1 className="column-headerTitle">
        <div className="column-headerTitleSub">{token.acct}</div>
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

    const friends = this.state.sortedFriends || this.state.friends

    return (
      <div className="friends">
        {this.renderFilter()}
        <ul className="friends-list">
          {friends.map((friend) => (
            <li key={friend.key}>
              <FriendRow
                friend={friend}
                onClickFriend={::this.onClickFriend}
                />
            </li>
          ))}
        </ul>
      </div>
    )
  }

  /**
   * @override
   */
  getStateFromContext() {
    const state = super.getStateFromContext()
    state.token = state.tokenState.getTokenByAcct(this.props.subject)
    return state
  }

  /**
   * @override
   */
  onChangeConext() {
    super.onChangeConext()
    this.listener.updateTokens(this.state.token)
  }

  renderFilter() {
    const {filter} = this.state

    return (
      <div className="friends-filter">
        <input type="text" value={filter} onChange={::this.onChangeFilter} placeholder="絞り込む" />
      </div>
    )
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
      to: friend.account.acct,
      from: this.props.subject,
    })
  }

  /**
   * 絞り込む。とりあえずusernameをレーベンシュタイン距離でソートしてみる
   * @param {Event} e
   */
  onChangeFilter(e) {
    const filter = e.target.value
    let sortedFriends

    if(filter.length) {
      const levenshtein = require('fast-levenshtein')
      const distanceCache = {}

      const _getDistance = (account) => {
        if(distanceCache[account.acct] === undefined) {
          distanceCache[account.acct] = levenshtein.get(filter, account.username)
        }
        return distanceCache[account.acct]
      }

      const _compare = (a, b) => {
        if(a > b)
          return 1
        else if(a < b)
          return -1
        return 0
      }

      sortedFriends = [].concat(this.state.friends)
      sortedFriends.sort((a, b) => {
        let r = _compare(_getDistance(a.account), _getDistance(b.account))
        if(r === 0)
          r = _compare(a.id, b.id)
        return r
      })
    }

    this.setState({filter, sortedFriends})
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
            <span className="user-account">@{account.acct}</span>
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
    return this.account.uri
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
    this.token = null
    this.state = {
      friends: null,
    }
  }

  open(token) {
    this.token = token
    this.refresh()
  }

  updateTokens(token) {
    this.token = token
    this.refresh()
  }

  async refresh() {
    if(!this.token)
      return

    const {requester, account} = this.token
    const response = await Promise.all([
      requester.listFollowings({id: account.getIdByHost(this.token.host), limit: 80}),
      requester.listFollowers({id: account.getIdByHost(this.token.host), limit: 80}),
    ])
    const friends = new Map()

    response.forEach(({entities, result}) => {
      const {accounts} = entities
      Object.values(accounts).forEach((account) => {
        if(!friends.has(account.uri))
          friends.set(account.uri, new UIFriend(account))
      })
    })

    // TODO: 最近お話した順でソートしたいね

    this.state.friends = Array.from(friends.values())
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
