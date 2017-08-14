/* @flow */
import React from 'react'
import {findDOMNode} from 'react-dom'
import {intlShape} from 'react-intl'
import {List} from 'immutable'
import classNames from 'classnames'
import Toggle from 'react-toggle'
import {FormattedMessage as _FM} from 'react-intl'
import {ContextPropType} from 'src/propTypes'
import {
  COLUMN_TAG,
  SUBJECT_MIXED,
  STREAM_TAG,
  TIMELINE_FILTER_BOOST, TIMELINE_FILTER_REPLY,
} from 'src/constants'
import {StatusRef} from 'src/infra/TimelineData'
import ReplaceColumnUseCase from 'src/usecases/ReplaceColumnUseCase'
import {ColumnHeader, ColumnHeaderMenu, NowLoading, UserIconWithHost} from 'src/pages/parts'
import {Account, OAuthToken, UIColumn} from 'src/models'
import PagingColumnContent from 'src/pages/components/PagingColumnContent'


// TODO: TimelineColumnと重複
const TIMELINE_FILTER_TEXT_MAP = {
  [TIMELINE_FILTER_BOOST]: 'column.menu.show_boosts',
  [TIMELINE_FILTER_REPLY]: 'column.menu.show_reply',
}

// TODO: TimelineColumnと重複
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
}

/**
 * Hashtag Column
 */
export default class HashTagColumn extends React.Component {
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
    const shouldFilterBoost = shouldFilter != null ? JSON.parse(shouldFilter) : false
    shouldFilter = localStorage.getItem(storageKeyForFilter(TIMELINE_FILTER_REPLY, subject, timelineType))
    const shouldFilterReply = shouldFilter != null ? JSON.parse(shouldFilter) : false

    this.state = {
      ...this.state,
      isMenuVisible: false,
      filters: new Map([
        [TIMELINE_FILTER_BOOST, shouldFilterBoost],
        [TIMELINE_FILTER_REPLY, shouldFilterReply],
      ]),
    }
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

  renderTitle() {
    const {column: {params: {tag}}} = this.props

    return (
      <h1 className="column-headerTitle">
        <_FM id="column.title.hashtag" values={{tag}} />
      </h1>
    )
  }

  renderMenuContent() {
    return (
      <ColumnHeaderMenu isCollapsed={!this.state.isMenuVisible} onClickClose={this.props.onClose}>
        {this.renderFilterMenus()}
        {this.tagAccountsMenu()}
      </ColumnHeaderMenu>
    )
  }

  renderFilterMenus() {
    return [...this.state.filters.entries()].map(([type, toggle]) => (
      <div className="menu-item menu-item--toggle" key={`${type}:${toggle ? 'true' : 'false'}`}>
        <Toggle
          checked={toggle}
          onChange={this.onChangeTimelineFilter.bind(this, type)} />
        <label htmlFor={`${type}-visibility`}><_FM id={TIMELINE_FILTER_TEXT_MAP[type]} /></label>
      </div>
    ))
  }

  tagAccountsMenu() {
    const {column: {params: {subject}}, tokens} = this.props
    const subjects = subject.split(',')

    return (
      <div className="menu-item">
        <h2><_FM id="column.menu.accountts.for" /></h2>
        <ul className="menu-accounts">
          {tokens.map((token) => {
            const {account} = token
            const isSelected = subjects.indexOf(account.acct) >= 0

            return (
              <li className={isSelected && 'is-selected'}
                  key={account.acct}
                  onClick={this.onToggleAccount.bind(this, account)}>
                <UserIconWithHost account={account} size="small" />
              </li>
            )
          })}
        </ul>
        <p className="menu-note"><_FM id="column.menu.accountts.select_multiple_author" /></p>
      </div>
    )
  }

  renderBody() {
    const {
      column: {params: {subject}},
      isLoading, isTailLoading, timeline, tokens,
      onLockedPaging, onUnlockedPaging,
    } = this.props

    return (
      <div className={classNames(
        'column-body',
        {'is-loading': isLoading}
      )}>
        <PagingColumnContent
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


  onToggleAccount(account: Account, e: SyntheticEvent) {
    const {column: {type, params: {subject, tag}}} = this.props
    const {acct} = account
    let subjects = subject.split(',')

    if(e.shiftKey) {
      subjects = [...subjects]
      const idx = subjects.indexOf(acct)

      if(idx >= 0) {
        subjects.splice(idx, 1)
      } else {
        subjects.push(acct)
      }
    } else {
      subjects = [acct]
    }

    const {context} = this.context
    const params = {
      menuVisible: true,
      subject: subjects.join(),
      tag,
    }

    context.useCase(new ReplaceColumnUseCase()).execute(this.props.column, type, params)
  }

  // TODO: TimelineActionsに移す
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
