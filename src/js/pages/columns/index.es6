/* @flow */
import React from 'react'
import {findDOMNode} from 'react-dom'
import type {DragSourceMonitor} from 'react-dnd'

import {UIColumn} from 'src/models'
import type {ColumnFactoryFunction} from './types'


// column factory


class ColumnFactory {
  _factories: Map<string, ColumnFactoryFunction> = new Map()

  register(type: string, f: ColumnFactoryFunction) {
    this._factories.set(type, f)
  }

  create(column: UIColumn): ?React.Element<any> {
    const f = this._factories.get(column.type)

    return f != null ? f(column) : null
  }
}

export default new ColumnFactory()


// react-dnd


export const columnDragSource = {
  beginDrag(props: any, monitor: DragSourceMonitor, component: React.Component<*, *, *>) {
    let width = 0
    const node = findDOMNode(component)

    if(node != null && node instanceof HTMLElement) {
      width = node.getBoundingClientRect().width
    }

    return {
      index: props.index,
      width,
    }
  },
}

export const columnDragTarget = {
  hover(props: any, monitor: DragSourceMonitor, component: React.Component<*, *, *>) {
    const {width: columnWidth, index: dragIndex} = monitor.getItem()
    const hoverIndex = props.index

    if(dragIndex === hoverIndex) {
      return
    }

    const node = findDOMNode(component)

    if(node != null && node instanceof HTMLElement) {
      const {left: hoverLeft, right: hoverRight} = node.getBoundingClientRect()
      const {x: draggingX} = monitor.getSourceClientOffset()
      const hoverMiddleX = hoverLeft + (hoverRight - hoverLeft) / 2

      // dragging to left
      if(dragIndex > hoverIndex && draggingX > hoverMiddleX) {
        return
      }

      // dragging to right
      if(dragIndex < hoverIndex && draggingX + columnWidth < hoverMiddleX) {
        return
      }

      props.onSwapColumn(dragIndex, hoverIndex)
      monitor.getItem().index = hoverIndex
    }
  },
}
