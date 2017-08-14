/* @flow */
import React from 'react'
import {UIColumn} from 'src/models'
import FriendsColumn from './FriendsColumn'
import HashTagColumn from './HashTagColumn'
import NotificationsColumn from './NotificationsColumn'
import TalkColumn from './TalkColumn'
import TimelineColumn from './TimelineColumn'

type Column =
  | FriendsColumn
  | HashTagColumn
  | NotificationsColumn
  | TalkColumn
  | TimelineColumn

type FactoryFunction = (column: UIColumn) => React.Element<Column>


class ColumnFactory {
  _factories: Map<string, FactoryFunction> = new Map()

  register(type: string, f: FactoryFunction) {
    this._factories.set(type, f)
  }

  create(column: UIColumn): ?React.Element<Column> {
    const f = this._factories.get(column.type)

    return f != null ? f(column) : null
  }
}

export default new ColumnFactory()
