/* @flow */
import React from 'react'
import {List} from 'immutable'

import {NotificationRef, StatusRef} from 'src/infra/TimelineData'
import {OAuthToken, UIColumn} from 'src/models'


export type ColumnFactoryFunction = (column: UIColumn) => React.Element<any>

export type DraggableColumnProps = {
  connectDragSource: Function,
  connectDropTarget: Function,
  isDragging: boolean,
}

export type DefaultColumnProps = {
  column: UIColumn,
  isLoading: boolean,
  index: number,
  token: OAuthToken,
  onClickHeader: (UIColumn, HTMLElement, ?HTMLElement) => void,
  onClose: () => void,
  onSubscribeListener: () => void,
  onUnsubscribeListener: () => void,
  onSwapColumn: (number, number) => void,
}

export type ColumnProps = DraggableColumnProps & DefaultColumnProps

export type TimelineFilter = Map<string, boolean>

export type TimelineColumnProps<T: NotificationRef | StatusRef> = ColumnProps & {
  isTailLoading: boolean,
  timeline: List<T>,
  tokens: List<OAuthToken>,
  onLockedPaging: () => void,
  onUnlockedPaging: () => void,
  onLoadMoreStatuses: () => void,
  onUpdateTimelineFilter: (TimelineFilter) => void,
}
