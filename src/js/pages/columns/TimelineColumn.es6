/* @flow */
import React from 'react'
import {findDOMNode} from 'react-dom'
import {intlShape} from 'react-intl'
import {List} from 'immutable'
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
import {OAuthToken, UIColumn} from 'src/models'
import {ColumnFilterText, ColumnHeader, ColumnHeaderMenu, NowLoading} from 'src/pages/parts'
import PagingColumnContent from 'src/pages/components/PagingColumnContent'

const TIMELINE_FILTER_TEXT_MAP = {
  [TIMELINE_FILTER_BOOST]: 'column.menu.show_boosts',
  [TIMELINE_FILTER_REPLY]: 'column.menu.show_reply',
}

const storageKeyForFilter = (type, subject, timelineType) => (
  `naumanni::${type}:${subject}-${timelineType}`
)

type TimelineFilter = Map<string, boolean>

type Props = {
  column: UIColumn,
  token: OAuthToken,
  tokens: List<OAuthToken>,
  isLoading: boolean,
  isTailLoading: boolean,
  timeline: List<StatusRef>,
  onLockedPaging: () => void,
  onUnlockedPaging: () => void,
  onLoadMoreStatuses: () => void,
  onSubscribeListener: () => void,
  onUnsubscribeListener: () => void,
  onUpdateTimelineFilter: (TimelineFilter) => void,
  onClickHeader: (UIColumn, HTMLElement, ?HTMLElement) => void,
  onClose: () => void,
}

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

    const {column: {params: {subject, timelineType}}} = this.props

    let shouldFilter = localStorage.getItem(storageKeyForFilter(TIMELINE_FILTER_BOOST, subject, timelineType))
    const shouldFilterBoost: boolean = shouldFilter != null ? JSON.parse(shouldFilter) : false
    shouldFilter = localStorage.getItem(storageKeyForFilter(TIMELINE_FILTER_REPLY, subject, timelineType))
    const shouldFilterReply: boolean = shouldFilter != null ? JSON.parse(shouldFilter) : false
    const filterRegex = localStorage.getItem(storageKeyForFilter(TIMELINE_FILTER_REGEX, subject, timelineType))

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

  /**
   * @override
   */
  render() {
    const {isLoading} = this.props

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
        onChange={this.onChangeFilterRegex.bind(this)}
        placeholder={formatMessage({id: 'column.menu.filter_regex'})}
        value={filterRegex}
      />,
    ]
  }

  renderBody() {
    const {
      column: {params: {subject}},
      isLoading, isTailLoading, timeline, tokens,
      onLockedPaging, onUnlockedPaging,
    } = this.props
    const {filterRegex} = this.state

    return (
      <div className={classNames(
        'column-body',
        {'is-loading': isLoading}
      )}>
        <PagingColumnContent
          filterRegex={filterRegex}
          isTailLoading={isTailLoading}
          subject={subject}
          timeline={timeline}
          tokens={tokens}
          onLoadMoreStatuses={this.onLoadMoreStatuses.bind(this)}
          onLockedPaging={onLockedPaging}
          onUnlockedPaging={onUnlockedPaging}
          onScrollNodeLoaded={this.onScrollNodeLoaded.bind(this)}
        />
      </div>
    )
  }


  // cb


  onChangeTimelineFilter(type: string) {
    const {column: {params: {subject, timelineType}}, onUpdateTimelineFilter} = this.props
    const {filters} = this.state
    const newValue = !filters.get(type)

    filters.set(type, newValue)
    this.setState({filters})

    onUpdateTimelineFilter(filters)

    localStorage.setItem(
      storageKeyForFilter(type, subject, timelineType),
      newValue ? 'true' : 'false')
  }

  onChangeFilterRegex(filterRegex: string) {
    const {column: {params: {subject, timelineType}}} = this.props
    this.setState({filterRegex})

    localStorage.setItem(
      storageKeyForFilter(TIMELINE_FILTER_REGEX, subject, timelineType),
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
