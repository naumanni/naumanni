import React from 'react'
import {FormattedMessage as _FM} from 'react-intl'

import {
  COLUMN_NOTIFICATIONS, SUBJECT_MIXED, MAX_STATUSES, AUTO_PAGING_MARGIN,
} from 'src/constants'
import {NotificationTimeline} from 'src/models/Timeline'
import NotificationListener from 'src/controllers/NotificationListener'
import TimelineNotification from 'src/pages/components/TimelineNotification'
import {NotificationTimelineLoader} from 'src/controllers/TimelineLoader'
import PagingColumn from './PagingColumn'


/**
 * 通知カラム
 * TODO: TimelineColumnとのコピペなのを何とかする
 */
export default class NotificationColumn extends PagingColumn {
  static propTypes = {
    ...PagingColumn.propTypes,
  }

  constructor(...args) {
    super(...args)
  }

  /**
   * @override
   */
  renderTitle() {
    const {formatMessage} = this.context.intl

    if(this.isMixedTimeline()) {
      return formatMessage({id: 'column.title.united_notifications'})
    } else {
      const {token} = this.state

      if(!token)
        return formatMessage({id: 'column.title.notifications'})

      return (
        <h1 className="column-headerTitle">
          <div className="column-headerTitleSub">{token.acct}</div>
          <div className="column-headerTitleMain"><_FM id="column.title.notifications" /></div>
        </h1>
      )
    }
  }

  /**
   * @override
   */
  columnMenus() {
    return (
      <div className="menu-item--default" onClick={this.onClickClear.bind(this)}>
        <_FM id="column.menu.clear_notifications" />
      </div>
    )
  }

  /**
   * @override
   */
  renderTimelineRow(ref) {
    const {subject} = this.props
    const {tokens} = this.state.tokenState

    return (
      <li key={ref.uri}>
        <TimelineNotification
          subject={subject !== SUBJECT_MIXED ? subject : null}
          notificationRef={ref}
          tokens={tokens}
          onLockStatus={() => this.scrollLockCounter.increment()}
          {...this.actionDelegate.props}
        />
      </li>
    )
  }

  /**
   * @override
   */
  get timelineClass() {
    return NotificationTimeline
  }

  /**
   * @override
   */
  get listenerClass() {
    return NotificationListener
  }

  /**
   * @override
   */
  makeLoaderForToken(timeline, token) {
    return new NotificationTimelineLoader(timeline, token, this.db)
  }

  // cb
  onClickClear() {
    const {formatMessage} = this.context.intl

    if(window.confirm(formatMessage({id: 'column.menu.confirm.clear_notifications'}))) {
      this.clear()
    }
  }

  // private
  async clear() {
    this.subtimeline && this.clearTimeline(this.subtimeline)
    this.clearTimeline(this.timeline)

    const token = this.state.tokenState.getTokenByAcct(this.props.subject)
    await token.requester.clearNotifications({}, {token})
  }

  clearTimeline(timeline) {
    const {uris} = timeline

    uris.forEach((uri) => timeline.delete(uri))
    this.db.decrement(uris)
  }
}
require('./').registerColumn(COLUMN_NOTIFICATIONS, NotificationColumn)
