import PropTypes from 'prop-types'
import React from 'react'
import ReactDOM from 'react-dom'

import {
  COLUMN_TIMELINE,
  TIMELINE_FEDERATION, TIMELINE_LOCAL, TIMELINE_HOME, SUBJECT_MIXED,
  STREAM_HOME, STREAM_LOCAL, STREAM_FEDERATION,
  AUTO_PAGING_MARGIN, MAX_STATUSES,
} from 'src/constants'
import TimelineListener from 'src/controllers/TimelineListener'
import {makeTimelineLoader} from 'src/controllers/TimelineLoader'
import {StatusTimeline} from 'src/models/Timeline'
import PagingColumn from './PagingColumn'
import TimelineStatusContainer from '../components/TimelineStatusContainer'

const TIMELINE_TO_STREAM_MAP = {
  [TIMELINE_HOME]: STREAM_HOME,
  [TIMELINE_LOCAL]: STREAM_LOCAL,
  [TIMELINE_FEDERATION]: STREAM_FEDERATION,
}


/**
 * タイムラインのカラム
 */
export default class TimelineColumn extends PagingColumn {
  static propTypes = {
    ...PagingColumn.propTypes,
    timelineType: PropTypes.string.isRequired,
  }

  constructor(...args) {
    super(...args)

    this.state = {
      ...this.state,
      loading: true,
    }
  }

  /**
   * @override
   */
  renderTitle() {
    const {formatMessage} = this.context.intl

    if(this.isMixedTimeline()) {
      return formatMessage({id: `column.title.united_timeline_${this.props.timelineType}`})
    } else {
      const {token} = this.state
      const typeName = formatMessage({id: `column.title.timeline_${this.props.timelineType}`})

      if(!token)
        return typeName

      return (
        <h1 className="column-headerTitle">
          <div className="column-headerTitleSub">{token.acct}</div>
          <div className="column-headerTitleMain">{typeName}</div>
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
        <TimelineStatusContainer
          subject={subject !== SUBJECT_MIXED ? subject : null}
          tokens={tokens}
          onLockStatus={() => this.scrollLockCounter.increment()}
          {...ref.expand()}
          {...this.actionDelegate.props}
        />
      </li>
    )
  }

  /**
   * @override
   */
  get timelineClass() {
    return StatusTimeline
  }

  /**
   * @override
   */
  get listenerClass() {
    const {timelineType} = this.props

    class _TimelineListener extends TimelineListener {
      addListener(key, token) {
        const websocketUrl = token.instance.makeStreamingAPIUrl(
          token,
          TIMELINE_TO_STREAM_MAP[timelineType]
        )
        super.addListener(key, token, websocketUrl)
      }
    }
    return _TimelineListener
  }

  /**
   * @override
   */
  makeLoaderForToken(timeline, token) {
    const {timelineType} = this.props

    // load timeline
    return makeTimelineLoader(timelineType, timeline, token, this.db)
  }
}
require('./').registerColumn(COLUMN_TIMELINE, TimelineColumn)
