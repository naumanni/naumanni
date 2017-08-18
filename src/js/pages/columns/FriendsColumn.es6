/* @flow */
import React from 'react'
import {findDOMNode} from 'react-dom'
import {FormattedMessage as _FM} from 'react-intl'
import {intlShape} from 'react-intl'
import {DragSource, DropTarget} from 'react-dnd'
import flow from 'lodash.flow'

import {AppPropType, ContextPropType} from 'src/propTypes'
import {
  DRAG_SOURCE_COLUMN,
  COLUMN_FRIENDS, COLUMN_TALK,
  SUBJECT_MIXED,
} from 'src/constants'
import {Account} from 'src/models'
import AddColumnUseCase from 'src/usecases/AddColumnUseCase'
import TimelineActions from 'src/controllers/TimelineActions'
import AccountRow from '../components/AccountRow'
import {fuzzy_match as fuzzyMatch} from 'src/libs/fts_fuzzy_match'
import {ColumnHeader, ColumnHeaderMenu, NowLoading} from '../parts'
import FriendsListener, {UIFriend} from 'src/controllers/FriendsListener'
import {columnDragSource, columnDragTarget} from 'src/pages/columns'
import type {ColumnProps} from './types'


type Props = ColumnProps & {
  friends: UIFriend[],
}

type State = {
  filter: string,
  isMenuVisible: boolean,
  sortedFriends: ?UIFriend[],
}


/**
 * タイムラインのカラム
 */
class FriendsColumn extends React.Component {
  static contextTypes = {
    app: AppPropType,
    context: ContextPropType,
    intl: intlShape,
  }
  props: Props
  state: State

  listener: FriendsListener
  actionDelegate: TimelineActions

  constructor(...args: any[]) {
    super(...args)
    // mixed timeline not allowed
    require('assert')(args[0].subject !== SUBJECT_MIXED)
    const {column: {params: {subject}}} = this.props

    this.listener = new FriendsListener(subject)
    this.actionDelegate = new TimelineActions(this.context)
    this.state = {
      filter: '',
      isMenuVisible: false,
      sortedFriends: undefined,
    }
  }

  /**
   * @override
   */
  componentDidMount() {
    this.props.onSubscribeListener()
  }

  /**
   * @override
   */
  componentWillUnmount() {
    this.props.onUnsubscribeListener()
  }

  /**
   * @override
   */
  render() {
    const {
      isDragging, connectDragSource, connectDropTarget,
      isLoading,
    } = this.props

    const opacity = isDragging ? 0 : 1

    return connectDragSource(connectDropTarget(
      <div className="column" style={{opacity}}>
        <ColumnHeader
          canShowMenuContent={!isLoading}
          isPrivate={true}
          menuContent={this.renderMenuContent()}
          title={this.renderTitle()}
          onClickHeader={this.onClickHeader.bind(this)}
          onClickMenu={this.onClickMenuButton.bind(this)}
        />

        {isLoading
          ? <div className="column-body is-loading"><NowLoading /></div>
          : this.renderBody()
        }
      </div>
    ))
  }

  renderTitle() {
    const {token} = this.props

    if(!token) {
      return <_FM id="column.title.message" />
    }

    return (
      <h1 className="column-headerTitle">
        <div className="column-headerTitleSub">{token.acct}</div>
        <div className="column-headerTitleMain"><_FM id="column.title.message" /></div>
      </h1>
    )
  }

  renderMenuContent() {
    return <ColumnHeaderMenu isCollapsed={!this.state.isMenuVisible} onClickClose={this.props.onClose} />
  }

  renderBody() {
    if(this.props.isLoading) {
      return <NowLoading />
    }

    const friends = this.state.sortedFriends || this.props.friends

    return (
      <div className="column-body column-body--friends">
        {this.renderFilter()}
        <ul className="friends-list" ref="friendsList">
          {friends.map((friend) => (
            <li key={friend.key}>
              <AccountRow
                account={friend.account}
                onClick={this.onClickFriend.bind(this)}
                {...this.actionDelegate.props}
              />
            </li>
          ))}
        </ul>
      </div>
    )
  }

  renderFilter() {
    const {filter} = this.state
    const {formatMessage: _} = this.context.intl

    return (
      <div className="friends-filter">
        <input type="text" value={filter} onChange={this.onChangeFilter.bind(this)}
          placeholder={_({id: 'message.freind_filter.placeholder'})} />
      </div>
    )
  }

  // cb

  onClickHeader() {
    const {column, onClickHeader} = this.props
    const node = findDOMNode(this)
    const scrollNode = findDOMNode(this.refs.friendsList)

    if(node instanceof HTMLElement) {
      if(scrollNode && scrollNode instanceof HTMLElement) {
        onClickHeader(column, node, scrollNode)
      } else {
        onClickHeader(column, node, undefined)
      }
    }
  }

  onClickMenuButton(e: SyntheticEvent) {
    e.stopPropagation()
    this.setState({isMenuVisible: !this.state.isMenuVisible})
  }

  onClickFriend(account: Account) {
    const {context} = this.context
    const {column: {params: {subject}}} = this.props

    context.useCase(new AddColumnUseCase()).execute(COLUMN_TALK, {
      to: account.acct,
      from: subject,
    })
  }

  /**
   * 絞り込む。とりあえずusernameをレーベンシュタイン距離でソートしてみる
   * @param {Event} e
   */
  onChangeFilter(e: SyntheticInputEvent) {
    const filter = e.target.value
    let sortedFriends

    if(filter.length) {
      sortedFriends =
        this.props.friends
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

export default flow(
  DragSource(DRAG_SOURCE_COLUMN, columnDragSource, (connect, monitor) => ({  // eslint-disable-line new-cap
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging(),
  })),
  DropTarget(DRAG_SOURCE_COLUMN, columnDragTarget, (connect) => ({  // eslint-disable-line new-cap
    connectDropTarget: connect.dropTarget(),
  }))
)(FriendsColumn)
