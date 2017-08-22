/* @flow */
import React from 'react'
import {findDOMNode} from 'react-dom'
import {DragSource, DropTarget} from 'react-dnd'
import flow from 'lodash.flow'
import type {DragSourceMonitor} from 'react-dnd'

import {DRAG_SOURCE_COLUMN} from 'src/constants'


type ReactClass = Class<React.Component<*, *, *>>

const columnDragSource = {
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

const columnDragTarget = {
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

export default function dndMount(klass: ReactClass): ReactClass {
  return flow(
    DragSource(DRAG_SOURCE_COLUMN, columnDragSource, (connect, monitor) => ({  // eslint-disable-line new-cap
      connectDragSource: connect.dragSource(),
      isDragging: monitor.isDragging(),
    })),
    DropTarget(DRAG_SOURCE_COLUMN, columnDragTarget, (connect) => ({  // eslint-disable-line new-cap
      connectDropTarget: connect.dropTarget(),
    }))
  )(klass)
}
