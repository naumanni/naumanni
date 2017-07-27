import PropTypes from 'prop-types'
import React from 'react'
import ReactDOM from 'react-dom'
import Toggle from 'react-toggle'
import {FormattedMessage as _FM} from 'react-intl'

import {
  COLUMN_TIMELINE,
  TIMELINE_FEDERATION, TIMELINE_LOCAL, TIMELINE_HOME, SUBJECT_MIXED,
  TIMELINE_FILTER_BOOST, TIMELINE_FILTER_REPLY, TIMELINE_FILTER_REGEX,
  STREAM_HOME, STREAM_LOCAL, STREAM_FEDERATION,
  AUTO_PAGING_MARGIN, MAX_STATUSES,
} from 'src/constants'
import TimelineListener from 'src/controllers/TimelineListener'
import {makeTimelineLoader} from 'src/controllers/TimelineLoader'
import {StatusTimeline} from 'src/models/Timeline'
import PagingColumn from './PagingColumn'
import TimelineStatusContainer from '../components/TimelineStatusContainer'
import {ColumnFilterText} from 'src/pages/parts'

const TIMELINE_TO_STREAM_MAP = {
  [TIMELINE_HOME]: STREAM_HOME,
  [TIMELINE_LOCAL]: STREAM_LOCAL,
  [TIMELINE_FEDERATION]: STREAM_FEDERATION,
}

const TIMELINE_FILTER_TEXT_MAP = {
  [TIMELINE_FILTER_BOOST]: 'column.menu.show_boosts',
  [TIMELINE_FILTER_REPLY]: 'column.menu.show_reply',
}

const storageKeyForFilter = (type, subject, timelineType) => (
  `naumanni::${type}:${subject}-${timelineType}`
)


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

    const {subject, timelineType} = this.props

    this.state = {
      ...this.state,
      loading: true,
      filters: new Map([
        [TIMELINE_FILTER_BOOST, localStorage.getItem(storageKeyForFilter(TIMELINE_FILTER_BOOST, subject, timelineType))
          ? JSON.parse(localStorage.getItem(storageKeyForFilter(TIMELINE_FILTER_BOOST, subject, timelineType)))
          : true],
        [TIMELINE_FILTER_REPLY, localStorage.getItem(storageKeyForFilter(TIMELINE_FILTER_REPLY, subject, timelineType))
          ? JSON.parse(localStorage.getItem(storageKeyForFilter(TIMELINE_FILTER_REPLY, subject, timelineType)))
          : true],
      ]),
      filterRegex: localStorage.getItem(storageKeyForFilter(TIMELINE_FILTER_REGEX, subject, timelineType))
        ? localStorage.getItem(storageKeyForFilter(TIMELINE_FILTER_REGEX, subject, timelineType))
        : '',
    }
  }

  /**
   * @override
   */
  componentDidMount() {
    super.componentDidMount()
    this.timeline.updateFilter(this.state.filters)
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
  columnMenus() {
    return [
      ...this.toggleFilterMenus(),
      ...this.regexFilterMenu(),
    ]
  }

  toggleFilterMenus() {
    return [...this.state.filters.entries()].map(([type, toggle]) => (
      <div className="menu-item menu-item--toggle" key={`${type}:${toggle}`}>
        <Toggle
          checked={toggle}
          onChange={this.onChangeTimelineFilter.bind(this, type)} />
        <label htmlFor={`${type}-visibility`}><_FM id={TIMELINE_FILTER_TEXT_MAP[type]} /></label>
      </div>
    ))
  }

  regexFilterMenu() {
    const {formatMessage} = this.context.intl
    const {filterRegex} = this.state

    return [
      <ColumnFilterText
        onChange={this.onChangeFilterRegex.bind(this)}
        placeholder={formatMessage({id: 'column.menu.filter_regex'})}
        value={filterRegex}
      />,
    ]
  }

  /**
   * @override
   */
  renderTimelineRow(ref) {
    const {subject} = this.props
    const {tokens} = this.state.tokenState
    const {filterRegex} = this.state

    if(filterRegex.trim().length > 0) {
      const regex = new RegExp(filterRegex.trim(), 'i')

      if(regex.test(ref.resolve().plainContent)) {
        return null
      }
    }

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

  // cb
  onChangeTimelineFilter(type) {
    const {filters} = this.state
    const newValue = !filters.get(type)

    filters.set(type, newValue)
    this.setState({filters})

    this.timeline.updateFilter(filters)
    this.subtimeline && this.subtimeline.updateFilter(filters)

    localStorage.setItem(
      storageKeyForFilter(type, this.props.subject, this.props.timelineType),
      newValue)
  }

  onChangeFilterRegex(filterRegex) {
    this.setState({filterRegex})

    localStorage.setItem(
      storageKeyForFilter(TIMELINE_FILTER_REGEX, this.props.subject, this.props.timelineType),
      filterRegex)
  }

}
require('./').registerColumn(COLUMN_TIMELINE, TimelineColumn)
