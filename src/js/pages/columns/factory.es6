/* @flow */
import React from 'react'

import {UIColumn} from 'src/models'
import {getColumnClassForType} from 'src/pages/uiColumns'
import type {ColumnPropsFactoryFunction} from './types'


class ColumnFactory {
  _propsFactories: Map<string, ColumnPropsFactoryFunction> = new Map()

  register(type: string, f: ColumnPropsFactoryFunction) {
    this._propsFactories.set(type, f)
  }

  create(column: UIColumn): React.Element<any> {
    const f = this._propsFactories.get(column.type)
    const props = f != null ? f(column) : {}
    const klass = getColumnClassForType(column.type)

    return React.createElement(klass, props)
  }
}

export default new ColumnFactory()
