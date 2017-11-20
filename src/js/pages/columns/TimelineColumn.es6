/* @flow */
import React from 'react'
import {findDOMNode} from 'react-dom'
import {intlShape} from 'react-intl'
import classNames from 'classnames'
import Toggle from 'react-toggle'
import {FormattedMessage as _FM} from 'react-intl'

import {
  COLUMN_TIMELINE,
  SUBJECT_MIXED,
  TIMELINE_FILTER_BOOST, TIMELINE_FILTER_REPLY, TIMELINE_FILTER_REGEX,
} from 'src/constants'
import {ContextPropType} from 'src/propTypes'
import {StatusRef} from 'src/infra/TimelineData'
import {ColumnFilterText, ColumnHeader, ColumnHeaderMenu, NowLoading} from 'src/pages/parts'
import PagingColumnContent from 'src/pages/components/PagingColumnContent'
import {registerColumn} from 'src/pages/uiColumns'
import type {TimelineColumnProps, TimelineFilter} from './types'


const TIMELINE_FILTER_TEXT_MAP = {
  [TIMELINE_FILTER_BOOST]: 'column.menu.show_boosts',
  [TIMELINE_FILTER_REPLY]: 'column.menu.show_reply',
}

type Props = TimelineColumnProps<StatusRef>
type State = {
  isMenuVisible: boolean,
  filters: TimelineFilter,
  filterRegex: string,
}


/**
 * タイムラインのカラム
 */
export default class TimelineColumn extends React.Component {
  static contextTypes = {
    context: ContextPropType,
    intl: intlShape,
  }
  props: Props
  state: State

  scrollNode: ?HTMLElement

  constructor(...args: any[]) {
    super(...args)

    let shouldFilter = localStorage.getItem(this.storageKeyForFilter(TIMELINE_FILTER_BOOST))
    const shouldFilterBoost: boolean = shouldFilter != null ? JSON.parse(shouldFilter) : false
    shouldFilter = localStorage.getItem(this.storageKeyForFilter(TIMELINE_FILTER_REPLY))
    const shouldFilterReply: boolean = shouldFilter != null ? JSON.parse(shouldFilter) : false
    const filterRegex = localStorage.getItem(this.storageKeyForFilter(TIMELINE_FILTER_REGEX))

    this.state = {
      isMenuVisible: false,
      filters: new Map([
        [TIMELINE_FILTER_BOOST, shouldFilterBoost],
        [TIMELINE_FILTER_REPLY, shouldFilterReply],
      ]),
      filterRegex: filterRegex != null ? filterRegex : '',
    }
  }

  get isMixedTimeline(): boolean {
    const {column: {params: {subject}}} = this.props

    return subject === SUBJECT_MIXED
  }

  storageKeyForFilter(type: string) {
    const {column: {params: {subject, timelineType}}} = this.props

    return `naumanni::${type}:${subject}-${timelineType}`
  }

  /**
   * @override
   */
  componentDidMount() {
    this.props.onSubscribeListener()
    this.props.onUpdateTimelineFilter(this.state.filters)
  }

  /**
   * @override
   */
  componentWillUnmount() {
    this.props.onUnsubscribeListener()
  }

  render() {
    const {
      isLoading,
    } = this.props

    return (
      <div className="column">
        <ColumnHeader
          canShowMenuContent={!isLoading}
          isPrivate={true}
          menuContent={this.renderMenuContent()}
          title={this.renderTitle()}
          onClickHeader={this.onClickHeader.bind(this)}
          onClickMenu={this.onClickMenuButton.bind(this)}
        />

        {isLoading
          ? <div className="column-body is-loading"><NowLoading /></div>
          : this.renderBody()
        }
      </div>
    )
  }


  // render


  renderTitle() {
    const {column: {params: {timelineType}}} = this.props
    const {formatMessage} = this.context.intl

    if(this.isMixedTimeline) {
      return (
        <h1 className="column-headerTitle">
          <_FM id={`column.title.united_timeline_${timelineType}`} />
        </h1>
      )
    } else {
      const {token} = this.props
      const typeName = formatMessage({id: `column.title.timeline_${timelineType}`})

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

  renderMenuContent() {
    return (
      <ColumnHeaderMenu isCollapsed={!this.state.isMenuVisible} onClickClose={this.props.onClose}>
        {this.renderFilterMenus()}
      </ColumnHeaderMenu>
    )
  }

  renderFilterMenus() {
    return [
      ...this.toggleFilterMenus(),
      ...this.regexFilterMenu(),
    ]
  }

  toggleFilterMenus() {
    return [...this.state.filters.entries()].map(([type, toggle]) => (
      <div className="menu-item menu-item--toggle" key={`${type}:${toggle ? 'true' : 'false'}`}>
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
        key={TIMELINE_FILTER_REGEX}
        onChange={this.onChangeFilterRegex.bind(this)}
        placeholder={formatMessage({id: 'column.menu.filter_regex'})}
        value={filterRegex}
      />,
    ]
  }

  renderBody() {
    const {isLoading} = this.props
    const props = this.propsForPagingContent()

    return (
      <div className={classNames(
        'column-body',
        {'is-loading': isLoading}
      )}>
        <PagingColumnContent {...props} />
      </div>
    )
  }

  propsForPagingContent() {
    const {
      column: {params: {subject}},
      isTailLoading, timeline, tokens,
      onLockedPaging, onUnlockedPaging,
    } = this.props
    const {filterRegex} = this.state
    const props = {
      filterRegex,
      isTailLoading,
      subject,
      timeline,
      tokens,
      onLoadMoreStatuses: () => this.onLoadMoreStatuses(),
      onLockedPaging: () => onLockedPaging(),
      onUnlockedPaging: () => onUnlockedPaging(),
      onScrollNodeLoaded: (el: HTMLElement) => this.onScrollNodeLoaded(el),
    }

    return props
  }


  // cb


  onChangeTimelineFilter(type: string) {
    const {filters} = this.state
    const newValue = !filters.get(type)

    filters.set(type, newValue)
    this.setState({filters})

    this.props.onUpdateTimelineFilter(filters)

    localStorage.setItem(
      this.storageKeyForFilter(type),
      newValue ? 'true' : 'false')
  }

  onChangeFilterRegex(filterRegex: string) {
    this.setState({filterRegex})

    localStorage.setItem(
      this.storageKeyForFilter(TIMELINE_FILTER_REGEX),
      filterRegex)
  }

  onScrollNodeLoaded(el: HTMLElement) {
    this.scrollNode = el
  }

  onLoadMoreStatuses() {
    this.props.onLoadMoreStatuses()
  }

  onClickHeader() {
    const {column, onClickHeader} = this.props
    const node = findDOMNode(this)

    if(node instanceof HTMLElement) {
      if(this.scrollNode != null) {
        onClickHeader(column, node, this.scrollNode)
      } else {
        onClickHeader(column, node, undefined)
      }
    }
  }

  onClickMenuButton(e: SyntheticEvent) {
    e.stopPropagation()
    this.setState({isMenuVisible: !this.state.isMenuVisible})
  }
}

registerColumn(COLUMN_TIMELINE, TimelineColumn)
