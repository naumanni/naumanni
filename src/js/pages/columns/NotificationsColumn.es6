/* @flow */
import React from 'react'
import {List} from 'immutable'
import {findDOMNode} from 'react-dom'
import {FormattedMessage as _FM} from 'react-intl'
import classNames from 'classnames'
import {intlShape} from 'react-intl'
import {ContextPropType} from 'src/propTypes'
import {
  COLUMN_NOTIFICATIONS, SUBJECT_MIXED, MAX_STATUSES,
} from 'src/constants'
import {NotificationRef} from 'src/infra/TimelineData'
import {OAuthToken, UIColumn} from 'src/models'
import {ColumnHeader, ColumnHeaderMenu, NowLoading} from 'src/pages/parts'
import PagingColumnContent from 'src/pages/components/PagingColumnContent'


type Props = {
  column: UIColumn,
  token: OAuthToken,
  tokens: List<OAuthToken>,
  isLoading: boolean,
  isTailLoading: boolean,
  timeline: List<NotificationRef>,
  onLockedPaging: () => void,
  onUnlockedPaging: () => void,
  onLoadMoreStatuses: () => void,
  onSubscribeListener: () => void,
  onUnsubscribeListener: () => void,
  onClickHeader: (UIColumn, HTMLElement, ?HTMLElement) => void,
  onClose: () => void,
}

type State = {
  isMenuVisible: boolean,
}

/**
 * 通知カラム
 */
export default class NotificationColumn extends React.Component {
  static contextTypes = {
    context: ContextPropType,
    intl: intlShape,
  }
  props: Props
  state: State

  scrollNode: ?HTMLElement

  constructor(...args: any[]) {
    super(...args)
    this.state = {
      isMenuVisible: false,
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
    const {formatMessage} = this.context.intl

    if(this.isMixedTimeline) {
      return (
        <h1 className="column-headerTitle">
          <_FM id="column.title.united_notifications" />
        </h1>
      )
    } else {
      const {token} = this.props

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

  renderMenuContent() {
    return <ColumnHeaderMenu isCollapsed={!this.state.isMenuVisible} onClickClose={this.props.onClose} />
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


  // private


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
