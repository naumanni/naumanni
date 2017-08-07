/* @flow */
import React from 'react'
import {findDOMNode} from 'react-dom'
import {Map} from 'immutable'

import {COLUMN_FRIENDS, COLUMN_NOTIFICATIONS, COLUMN_TALK} from 'src/constants'
import {ContextPropType} from 'src/propTypes'
import {UIColumn} from 'src/models'
import {niceScrollLeft} from 'src/utils'
import {getColumnClassForType} from 'src/pages/columns'
import FriendsListenerManager, {FriendsModel} from 'src/controllers/FriendsListenerManager'
import TalkListenerManager, {TalkModel} from 'src/controllers/TalkListenerManager'
import TimelineListenerManager, {TimelineModel} from 'src/controllers/TimelineListenerManager'
import TimelineActions from 'src/controllers/TimelineActions'
import FriendsColumn from 'src/pages/columns/FriendsColumn'
import NotificationColumn from 'src/pages/columns/NotificationsColumn'
import TalkColumn from 'src/pages/columns/TalkColumn'
import CloseColumnUseCase from 'src/usecases/CloseColumnUseCase'


type Props = {
  columns: UIColumn[],
}

type State = {
  friendsColumnModels: Map<string, FriendsModel>,
  talkColumnModels: Map<string, TalkModel>,
  timelineColumnModels: Map<string, TimelineModel>,
}

/**
 * カラムのコンテナ
 */
export default class ColumnContainer extends React.Component {
  static contextTypes = {
    context: ContextPropType,
  }

  props: Props
  state: State
  actionDelegate: TimelineActions
  listenerRemovers: Function[] = []

  constructor(...args: any[]) {
    super(...args)

    this.actionDelegate = new TimelineActions(this.context)
    this.state = {
      friendsColumnModels: new Map(),
      talkColumnModels: new Map(),
      timelineColumnModels: new Map(),
    }
  }

  /**
   * @override
   */
  componentDidMount() {
    const {context} = this.context

    this.listenerRemovers.push(
      context.onChange(this.onChangeContext.bind(this)),
      FriendsListenerManager.onChange(this.onChangeFriends.bind(this)),
      TalkListenerManager.onChange(this.onChangeTalk.bind(this)),
      TimelineListenerManager.onChange(this.onChangeTimeline.bind(this)),
    )
  }

  /**
   * @override
   */
  componentWillUnmount() {
    this.listenerRemovers.forEach((remover) => remover())
  }

  /**
   * @override
   */
  componentDidUpdate(prevProps: Props) {
    // 新しく追加されたカラムをFocusさせる
    const columnShouldFocus = this.props.columns.find(
      (column) => prevProps.columns.find((c) => c.key === column.key) ? false : true
    )
    if(columnShouldFocus) {
      this.scrollToColumn(columnShouldFocus.key)
    }
  }

  /**
   * @override
   */
  render() {
    const {columns} = this.props

    return (
      <div className="columnContainer" ref="container">
        {columns.map((column) => this.renderColumn(column))}
      </div>
    )
  }

  scrollToColumn(columnKey: string) {
    const columnNode = findDOMNode(this.refs[columnKey])
    if(!columnNode) {
      // まだ追加前では  componentDidUpdateのほうでフォローする
      return
    }
    const containerNode = findDOMNode(this.refs['container'])

    if(columnNode instanceof HTMLElement && containerNode instanceof HTMLElement) {
      // アニメーションさせる カッコイイ!!
      niceScrollLeft(
        containerNode,
        columnNode.offsetLeft - (containerNode.clientWidth - columnNode.clientWidth) / 2
      )
    }
  }

  renderColumn(column: UIColumn) {
    const {type, key} = column
    const klass = getColumnClassForType(type)

    switch(type) {
    case COLUMN_FRIENDS:
      return this.renderFriendsColumn(column)  // TODO: Reafactor
    case COLUMN_NOTIFICATIONS:
      return React.createElement(klass, {
        key,
        ...this.propsForTimelineColumn(column),
      })
    case COLUMN_TALK:
      return this.renderTalkColumn(column)  // TODO: Reafactor
    default:
      return React.createElement(klass, {
        ref: column.key,
        key: column.key,
        column: column,
        onClickHeader: this.scrollToColumn.bind(this),
        ...column.params,
      })
    }
  }

  renderFriendsColumn(column: UIColumn) {
    const {context} = this.context
    const {key, params: {subject}} = column
    const columnModel = this.state.friendsColumnModels.get(key) || new FriendsModel()
    const token = context.getState().tokenState.getTokenByAcct(subject)
    const props = {
      column: column,
      ...columnModel.toProps(),
      token,
      onClickHeader: this.onClickColumnHeader.bind(this),
      onClose: this.onCloseColumn.bind(this, column),
      onSubscribeListener: () => FriendsListenerManager.onSubscribeListener(token, column),
      onUnsubscribeListener: () => FriendsListenerManager.onUnsubscribeListener(column),
    }

    return <FriendsColumn key={column.key} {...props} />
  }

  renderNotificationColumn(column: UIColumn) {
    const props = {
      ref: column.key,
      key: column.key,
      column: column,
      onClickHeader: this.onClickColumnHeader.bind(this),
      onClose: this.onCloseColumn.bind(this, column),
      ...column.params,
    }

    return <NotificationColumn {...props} />
  }

  renderTalkColumn(column: UIColumn) {
    const {key, params: {from}} = column
    let columnModel = this.state.talkColumnModels.get(key)
    if(!columnModel) {
      columnModel = new TalkModel()
    }
    const {context} = this.context
    const {tokenState} = context.getState()
    const token = tokenState.getTokenByAcct(from)

    const props = {
      column,
      token,
      ...columnModel.toProps(),
      onClickHashTag: (tag) => this.actionDelegate.onClickHashTag(tag),
      onClickHeader: this.onClickColumnHeader.bind(this),
      onClose: this.onCloseColumn.bind(this, column),
      onSubscribeListener: () => TalkListenerManager.onSubscribeListener(token, column),
      onUnsubscribeListener: () => TalkListenerManager.onUnsubscribeListener(column),
    }

    return <TalkColumn key={column.key} {...props} />
  }

  defaultPropsForColumn(column: UIColumn) {
    return {
      column,
      ...this.handlerPropsForColumn(column),
    }
  }

  handlerPropsForColumn(column: UIColumn) {
    return {
      onClickHeader: this.onClickColumnHeader.bind(this),
      onClose: this.onCloseColumn.bind(this, column),
    }
  }

  propsForTimelineColumn(column: UIColumn) {
    const {key, params: {subject}} = column
    const columnModel = this.state.timelineColumnModels.get(key) || new TimelineModel()
    const {context} = this.context
    const {tokenState} = context.getState()
    const token = tokenState.getTokenByAcct(subject)
    const tokens = tokenState.tokens
    const props = {
      ...columnModel.toProps(),
      token,
      tokens,
      onLockedPaging: () => TimelineListenerManager.onLocked(column),
      onUnlockedPaging: () => TimelineListenerManager.onUnlocked(column),
      onLoadMoreStatuses: () => TimelineListenerManager.onLoadMoreStatuses(column),
      onSubscribeListener: () => TimelineListenerManager.onSubscribeListener(column),
      onUnsubscribeListener: () => TimelineListenerManager.onUnsubscribeListener(column),
      ...this.defaultPropsForColumn(column),
    }

    return props
  }

  // cb
  onChangeContext() {
    const {context} = this.context
    const {tokenState} = context.getState()
    const {columns} = this.props

    columns
      .filter(({type}) => type === COLUMN_FRIENDS)
      .forEach((column) => {
        const token = tokenState.getTokenByAcct(column.params.subject)
        token && FriendsListenerManager.updateTokenIfNeed(token, column)
      })

    columns
      .filter(({type}) => type === COLUMN_TALK)
      .forEach((column) => {
        const token = tokenState.getTokenByAcct(column.params.from)
        token && TalkListenerManager.updateTokenIfNeed(token, column)
      })

    TimelineListenerManager.updateTokens(tokenState.tokens)
  }

  onClickColumnHeader(column: UIColumn, columnNode: HTMLElement, columnScrollNode: ?HTMLElement) {
    const columnBounds = columnNode.getBoundingClientRect()

    if(columnBounds.right > window.innerWidth || columnBounds.left < 0) {
      // if the column is out of the window, adjusts horizontal scroll
      this.scrollToColumn(column.key)
    } else if(columnScrollNode != null) {
      // if the column is in the window, reset its scroll offset
      columnScrollNode.scrollTop = 0
    }
  }

  onCloseColumn(column: UIColumn) {
    const {context} = this.context

    context.useCase(new CloseColumnUseCase()).execute(column)
  }

  onChangeFriends(columnKey: string, model: FriendsModel) {
    this.setState({
      friendsColumnModels: this.state.friendsColumnModels.set(columnKey, model),
    })
  }

  onChangeTalk(columnKey: string, model: TalkModel) {
    this.setState({
      talkColumnModels: this.state.talkColumnModels.set(columnKey, model),
    })
  }

  onChangeTimeline(columnKey: string, model: TimelineModel) {
    this.setState({
      timelineColumnModels: this.state.timelineColumnModels.set(columnKey, model),
    })
  }
}
