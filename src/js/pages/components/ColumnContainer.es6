import React from 'react'
import {findDOMNode} from 'react-dom'
import PropTypes from 'prop-types'

import {
  COLUMN_TIMELINE, COLUMN_FRIENDS, COLUMN_TALK,
} from 'src/constants'
import {UIColumn} from 'src/models'
import {niceScrollLeft} from 'src/utils'


/**
 * カラムのコンテナ
 */
export default class ColumnContainer extends React.Component {
  static propTypes = {
    columns: PropTypes.arrayOf(PropTypes.instanceOf(UIColumn)).isRequired,
  }

  constructor(...args) {
    super(...args)
  }

  /**
   * @override
   */
  componentDidUpdate(prevProps, prevState) {
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

  scrollToColumn(columnKey) {
    const columnNode = findDOMNode(this.refs[columnKey])
    if(!columnNode) {
      // まだ追加前では  componentDidUpdateのほうでフォローする
      return
    }
    const containerNode = findDOMNode(this.refs['container'])

    // アニメーションさせる カッコイイ!!
    niceScrollLeft(
      containerNode,
      columnNode.offsetLeft - (containerNode.clientWidth - columnNode.clientWidth) / 2
    )
  }

  renderColumn(column) {
    return React.createElement(
      this.columnClassByType(column.type), {
        ref: column.key,
        key: column.key,
        column: column,
        ...column.params,
      })
  }

  // TODO:しょぼい
  columnClassByType(type) {
    switch(type) {
    case COLUMN_TIMELINE: return require('../columns/TimelineColumn').default
    case COLUMN_FRIENDS: return require('../columns/FriendsColumn').default
    case COLUMN_TALK: return require('../columns/TalkColumn').default
    }
  }
}
