// import update from 'immutability-helper'
import PropTypes from 'prop-types'
import React from 'react'

import {SUBJECT_MIXED, COLUMN_FRIENDS, COLUMN_TALK} from 'src/constants'
import {TalkRecord} from 'src/models'
import AddColumnUseCase from 'src/usecases/AddColumnUseCase'
import TimelineActions from 'src/controllers/TimelineActions'
import Column from './Column'
import AccountRow from '../components/AccountRow'
import {fuzzy_match as fuzzyMatch} from 'src/libs/fts_fuzzy_match'


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
    this.actionDelegate = new TimelineActions(this.context)
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
      <div className={this.columnBodyClassName()}>
        {this.renderFilter()}
        <ul className="friends-list">
          {friends.map((friend) => (
            <li key={friend.key}>
              <AccountRow
                account={friend.account}
                onClick={::this.onClickFriend}
                {...this.actionDelegate.props}
              />
            </li>
          ))}
        </ul>
      </div>
    )
  }

  columnBodyClassName() {
    return super.columnBodyClassName() + ' column-body--friends'
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

  onClickFriend(account) {
    const {context} = this.context

    context.useCase(new AddColumnUseCase()).execute(COLUMN_TALK, {
      to: account.acct,
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
      sortedFriends =
        this.state.friends
          .map((friend) => {
            const {account} = friend
            const [matchedAcct, scoreAcct, formattedAcct] = fuzzyMatch(filter, account.acct)
            const [matchedDisplayName, scoreDisplayName, formattedDisplayName] =
              fuzzyMatch(filter, account.display_name || '')

            return {
              friend,
              matched: matchedAcct || matchedDisplayName,
              score: Math.max(scoreAcct, scoreDisplayName),
              formated: {
                acct: formattedAcct,
                displayName: formattedDisplayName,
              },
            }
          })
          .filter(({matched}) => matched)

      sortedFriends.sort(({score: scoreA}, {score: scoreB}) => {
        if(scoreA < scoreB)
          return 1
        else if(scoreA > scoreB)
          return -1
        return 0
      })
      sortedFriends = sortedFriends.map(({friend}) => friend)
    }

    this.setState({filter, sortedFriends})
  }
}


//
import {EventEmitter} from 'events'


class UIFriend {
  constructor(account) {
    this.account = account
    this.record = null
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
        if(!friends.has(account.acct))
          friends.set(account.acct, new UIFriend(account))
      })
    })

    // TODO: すげー雑
    const records = await TalkRecord.query.listByKey('subject', this.subject)
    for(const record of records) {
      // いまのところrecordのtargetは1人
      require('assert')(record.targets.size === 1)
      const friend = friends.get(record.targets.get(0))
      friend.record = record
    }

    // friend list
    const friendList = Array.from(friends.values())

    friendList.sort((a, b) => {
      if(a.record && !b.record) {
        return -1
      } else if(!a.record && b.record) {
        return 1
      } else if(a.record && b.record) {
        const dateA = a.record.lastSeenAtMoment
        const dateB = b.record.lastSeenAtMoment

        if(dateA.isBefore(dateB))
          return 1
        else if(dateA.isAfter(dateB))
          return -1
        else
          return 0
      } else if(!a.record && !b.record) {
        const acctA = a.account.acct.toLowerCase()
        const acctB = b.account.acct.toLowerCase()

        if(acctA > acctB)
          return 1
        else if(acctA < acctB)
          return -1
        else
          return 0
      }
    })


    this.state.friends = friendList
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
require('./').registerColumn(COLUMN_FRIENDS, FriendsColumn)
