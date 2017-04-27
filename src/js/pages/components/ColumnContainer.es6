import React from 'react'
import PropTypes from 'prop-types'

import {
  COLUMN_TIMELINE, COLUMN_FRIENDS,
} from 'src/constants'
import TimelineColumn from './TimelineColumn'
import FriendsColumn from './FriendsColumn'

/**
 * カラムのコンテナ
 */
export default class ColumnContainer extends React.Component {
  static contextTypes = {
    context: PropTypes.any,
  }

  constructor(...args) {
    super(...args)

    this.state = this.getStateFromContext()
  }

  /**
   * @override
   */
  componentDidMount() {
    // update accounts
    const {context} = this.context

    this.listenerRemovers = [
      context.onChange(() => this.setState(this.getStateFromContext())),
    ]
  }

  /**
   * @override
   */
  componentWillUnmount() {
    for(const remover of this.listenerRemovers) {
      remover()
    }
  }

  /**
   * @override
   */
  render() {
    const {columns} = this.state.columnState

    return (
      <div className="columnContainer">
        {columns.map((column) => React.createElement(
          this.columnClassByType(column.type), {
            key: column.key,
            column: column,
            ...column.params,
          }))}
      </div>
    )
  }

  renderColumn(column) {
    return
  }

  getStateFromContext() {
    return this.context.context.getState()
  }

  columnClassByType(type) {
    switch(type) {
    case COLUMN_TIMELINE: return TimelineColumn
    case COLUMN_FRIENDS: return FriendsColumn
    }
  }
}
