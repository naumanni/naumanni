/* @flow */
import React from 'react'
import {findDOMNode} from 'react-dom'
import {Map} from 'immutable'
import {DragDropContext} from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend'

import * as actions from 'src/actions'
import {COLUMN_FRIENDS, COLUMN_NOTIFICATIONS, COLUMN_TAG, COLUMN_TALK, COLUMN_TIMELINE} from 'src/constants'
import {ContextPropType} from 'src/propTypes'
import {UIColumn} from 'src/models'
import {niceScrollLeft} from 'src/utils'
import FriendsListenerManager, {FriendsModel} from 'src/controllers/FriendsListenerManager'
import TalkListenerManager, {TalkModel} from 'src/controllers/TalkListenerManager'
import TimelineListenerManager, {TimelineModel} from 'src/controllers/TimelineListenerManager'
import TimelineActions from 'src/controllers/TimelineActions'
import CloseColumnUseCase from 'src/usecases/CloseColumnUseCase'
import SwapColumnUseCase from 'src/usecases/SwapColumnUseCase'
import ColumnFactory from 'src/pages/columns/factory'


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
class ColumnContainer extends React.Component {
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
    ColumnFactory.register(COLUMN_FRIENDS, this.propsForFriendsColumn.bind(this))
    ColumnFactory.register(COLUMN_TAG, this.propsForHashtagColumn.bind(this))
    ColumnFactory.register(COLUMN_NOTIFICATIONS, this.propsForNotificationsColumn.bind(this))
    ColumnFactory.register(COLUMN_TALK, this.propsForTalkColumn.bind(this))
    ColumnFactory.register(COLUMN_TIMELINE, this.propsForTimelineColumn.bind(this))
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
      context.onDispatch(this.onContextDispatch.bind(this)),
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
        {columns.map((column) => ColumnFactory.create(column))}
      </div>
    )
  }

  // column factories

  propsForFriendsColumn(column: UIColumn): {[string]: any} {
    const {context} = this.context
    const {key, params: {subject}} = column
    const columnModel = this.state.friendsColumnModels.get(key) || new FriendsModel()
    const token = context.getState().tokenState.getTokenByAcct(subject)
    const props = {
      ...this.defaultPropsForColumn(column),
      ...columnModel.toProps(),
      token,
      onSubscribeListener: () => FriendsListenerManager.onSubscribeListener(token, column),
      onUnsubscribeListener: () => FriendsListenerManager.onUnsubscribeListener(column),
    }

    return props
  }

  propsForHashtagColumn(column: UIColumn): {[string]: any} {
    return this.propsForTimelineColumn(column)
  }

  propsForNotificationsColumn(column: UIColumn): {[string]: any} {
    const props = {
      ...this.propsForTimelineColumn(column),
      onClearNotifications: () => TimelineListenerManager.onClearNotifications(column),
    }

    return props
  }

  propsForTalkColumn(column: UIColumn): {[string]: any} {
    const {key, params: {from}} = column
    const columnModel = this.state.talkColumnModels.get(key) || new TalkModel()
    const {context} = this.context
    const {tokenState} = context.getState()
    const token = tokenState.getTokenByAcct(from)
    const props = {
      ...this.defaultPropsForColumn(column),
      token,
      ...columnModel.toProps(),
      onClickHashTag: (tag) => this.actionDelegate.onClickHashTag(tag),
      onClickMedia: (...args) => this.actionDelegate.onClickMedia(...args),
      onSubscribeListener: () => TalkListenerManager.onSubscribeListener(token, column),
      onUnsubscribeListener: () => TalkListenerManager.onUnsubscribeListener(column),
      onPushLocalStatus: TalkListenerManager.onPushLocalStatus.bind(
        TalkListenerManager, column),
    }

    return props
  }

  defaultPropsForColumn(column: UIColumn): {[string]: any} {
    return {
      key: column.key,
      index: this.props.columns.indexOf(column),
      column,
      ...this.handlerPropsForColumn(column),
    }
  }

  handlerPropsForColumn(column: UIColumn): {[string]: any} {
    return {
      onClickHeader: this.onClickColumnHeader.bind(this),
      onClose: this.onCloseColumn.bind(this, column),
      onSwapColumn: this.onSwapColumn.bind(this),
    }
  }

  propsForTimelineColumn(column: UIColumn): {[string]: any} {
    const {key, params: {subject}} = column
    const columnModel = this.state.timelineColumnModels.get(key) || new TimelineModel()
    const {context} = this.context
    const {tokenState} = context.getState()
    const token = tokenState.getTokenByAcct(subject)
    const tokens = tokenState.tokens
    const props = {
      ...this.defaultPropsForColumn(column),
      ...columnModel.toProps(),
      token,
      tokens,
      onLockedPaging: () => TimelineListenerManager.onLocked(column),
      onUnlockedPaging: () => TimelineListenerManager.onUnlocked(column),
      onLoadMoreStatuses: () => TimelineListenerManager.onLoadMoreStatuses(column),
      onSubscribeListener: () => TimelineListenerManager.onSubscribeListener(column),
      onUnsubscribeListener: () => TimelineListenerManager.onUnsubscribeListener(column),
      onUpdateTimelineFilter: TimelineListenerManager.onUpdateTimelineFilter.bind(
        TimelineListenerManager, column),
    }

    return props
  }

  // private

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

  onContextDispatch(payload) {
    switch(payload.type) {
    case actions.COLUMN_ADD_REQUESTED: {
        // カラムが追加されたらそこにFocusする
      const {column} = payload
      this.scrollToColumn(column.key)
      break
    }
    }
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

  onSwapColumn(from: number, to: number) {
    const {context} = this.context

    context.useCase(new SwapColumnUseCase()).execute(from, to)
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

export default DragDropContext(HTML5Backend)(ColumnContainer)  // eslint-disable-line new-cap
