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
import TimelineStatus from '../components/TimelineStatus'
import {makeTimelineLoader} from 'src/controllers/TimelineLoader'
import {StatusTimeline} from 'src/models/Timeline'
import PagingColumn from './PagingColumn'


// TODO: i10n
const TYPENAMEMAP = {
  [TIMELINE_FEDERATION]: 'Federated timeline',
  [TIMELINE_LOCAL]: 'Local timeline',
  [TIMELINE_HOME]: 'Home timeline',
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
    const typeName = TYPENAMEMAP[this.props.timelineType]

    if(this.isMixedTimeline()) {
      return `統合${typeName}`
    } else {
      const {token} = this.state

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
        <TimelineStatus
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
        const websocketUrl = makeWebsocketUrlByTimelineType(timelineType, token)
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


//
import {makeWebsocketUrl} from 'src/utils'

function makeWebsocketUrlByTimelineType(timelineType, token) {
  let url

  switch(timelineType) {
  case TIMELINE_HOME:
    url = makeWebsocketUrl(token, STREAM_HOME)
    break

  case TIMELINE_LOCAL:
    url = makeWebsocketUrl(token, STREAM_LOCAL)
    break

  case TIMELINE_FEDERATION:
    url = makeWebsocketUrl(token, STREAM_FEDERATION)
    break
  }
  return url
}
