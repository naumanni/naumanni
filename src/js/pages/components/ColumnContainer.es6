/* @flow */
import React from 'react'
import {findDOMNode} from 'react-dom'
import {Map} from 'immutable'

import {COLUMN_TALK} from 'src/constants'
import {ContextPropType} from 'src/propTypes'
import {UIColumn} from 'src/models'
import {niceScrollLeft} from 'src/utils'
import {getColumnClassForType} from 'src/pages/columns'
import TalkListenerManager, {TalkModel} from 'src/controllers/TalkListenerManager'
import TimelineActions from 'src/controllers/TimelineActions'
import TalkColumn from 'src/pages/columns/TalkColumn'
import CloseColumnUseCase from 'src/usecases/CloseColumnUseCase'


type Props = {
  columns: UIColumn[],
}

type State = {
  talkColumnModels: Map<string, TalkModel>
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
      talkColumnModels: new Map(),
    }
  }

  /**
   * @override
   */
  componentDidMount() {
    const {context} = this.context

    this.listenerRemovers.push(
      context.onChange(this.onChangeContext.bind(this)),
      TalkListenerManager.onChange(this.onChangeTalk.bind(this)),
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
    if(column.type === COLUMN_TALK) {
      return this.renderTalkColumn(column)
    }

    const klass = getColumnClassForType(column.type)
    return React.createElement(
      klass, {
        ref: column.key,
        key: column.key,
        column: column,
        onClickHeader: this.scrollToColumn.bind(this),
        ...column.params,
      })
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
      onClose: this.onCloseColumn.bind(this),
      onSubscribeListener: (...args) => TalkListenerManager.onSubscribeListener(...args),
      onUnsubscribeListener: (...args) => TalkListenerManager.onUnsubscribeListener(...args),
    }

    return <TalkColumn {...props} />
  }

  // cb
  onChangeContext() {
    const {context} = this.context
    const {tokenState} = context.getState()
    const {columns} = this.props

    columns
      .filter(({type}) => type === COLUMN_TALK)
      .forEach((column) => {
        const token = tokenState.getTokenByAcct(column.params.from)
        token && TalkListenerManager.updateTokenIfNeed(token, column)
      })
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

  onChangeTalk(columnKey: string, model: TalkModel) {
    this.setState({
      talkColumnModels: this.state.talkColumnModels.set(columnKey, model),
    })
  }
}
