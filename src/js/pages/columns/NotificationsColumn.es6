import React from 'react'

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
    if(this.isMixedTimeline()) {
      return 'United Notification'
    } else {
      const {token} = this.state

      if(!token)
        return 'Notification'

      return (
        <h1 className="column-headerTitle">
          <div className="column-headerTitleSub">{token.acct}</div>
          <div className="column-headerTitleMain">Notifications</div>
        </h1>
      )
    }
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
}
require('./').registerColumn(COLUMN_NOTIFICATIONS, NotificationColumn)
