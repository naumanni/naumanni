/* @flow */
import React from 'react'
import {findDOMNode} from 'react-dom'

import {UIColumn} from 'src/models'
import {niceScrollLeft} from 'src/utils'
import {getColumnClassForType} from 'src/pages/columns'


type Props = {
  columns: UIColumn[],
}

/**
 * カラムのコンテナ
 */
export default class ColumnContainer extends React.Component {
  props: Props

  constructor(...args: any[]) {
    super(...args)
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
}
