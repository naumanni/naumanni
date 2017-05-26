import React from 'react'
import PropTypes from 'prop-types'
import {intlShape, FormattedMessage as _FM} from 'react-intl'

import {OAuthTokenListPropType} from 'src/propTypes'
import {DropdownMenuButton, IconFont, UserIconWithHost} from 'src/pages/parts'
import {
  COLUMN_TIMELINE, COLUMN_FRIENDS, COLUMN_NOTIFICATIONS,
  TIMELINE_FEDERATION, TIMELINE_LOCAL, TIMELINE_HOME, SUBJECT_MIXED,
  TOOTFORM_PLACEHOLDER,
} from 'src/constants'
import TootWindow from '../TootWindow'

/**
 * ダッシュボードのヘッダ
 * [logo] [toot欄] [account icon] [account icon] [account icon] [account icon] .... [歯車]
 */
export default class DashboardHeader extends React.Component {
  static contextTypes = {
    intl: intlShape,
  }

  static propTypes = {
    tokens: OAuthTokenListPropType.isRequired,
    onStartAddAccount: PropTypes.func.isRequired,
    onOpenColumn: PropTypes.func.isRequired,
    onGenKey: PropTypes.func.isRequired,
    onShowSettings: PropTypes.func.isRequired,
    onSignOut: PropTypes.func.isRequired,
  }

  /**
   * @constructor
   */
  constructor(...args) {
    super(...args)

    this.state = {
      isShowTootWindow: false,
    }
  }

  /**
   * @override
   */
  render() {
    const {formatMessage: _} = this.context.intl
    const {isShowTootWindow} = this.state
    const {tokens} = this.props

    return (
      <header className="naumanniDashboard-header">
        <DropdownMenuButton modifier="mixedColumMenu" onRenderMenu={::this.onRenderCompoundMenu}>
          <img className="naumanniDashboard-header-logo" src="/static/images/naumanni-headerLogo.svg" />
        </DropdownMenuButton>

        <div className="naumanniDashboard-header-toot">
          <input
            className={`${isShowTootWindow ? 'is-hidden' : ''}`}
            type="text" placeholder={_({id: 'toot_form.placeholder'})}
            onFocus={::this.onTootFocus} />
          {isShowTootWindow && <TootWindow onClose={::this.onTootWindowClose} />}
        </div>

        <ul className="naumanniDashboard-header-accounts">
          {tokens.map((token) => this.renderAccount(token))}
          <li>
            <button className="naumanniDashboard-header-addAccountButton"
              onClick={() => this.props.onStartAddAccount()}>
              <IconFont iconName="plus" />
            </button>
          </li>
        </ul>

        <span className="naumanniDashboard-header-spacer" />

        <DropdownMenuButton onRenderMenu={::this.onRenderGlobalMenu}>
          <button className="naumanniDashboard-header-configButton">
            <IconFont iconName="cog" />
          </button>
        </DropdownMenuButton>

      </header>
    )
  }

  /**
   * ヘッダに顔アイコンを書くよ
   * @param {OAuthToken} token
   * @return {React.Component}
   */
  renderAccount(token) {
    return (
      <li key={token.address}>
        <DropdownMenuButton onRenderMenu={this.onRenderAccountMenu.bind(this, token)}>
          {token.isAlive()
            ? <UserIconWithHost account={token.account} />
            : <div className="naumanniDashboard-header-badToken">×</div>
          }
        </DropdownMenuButton>
      </li>
    )
  }

  // callbacks
  onRenderCompoundMenu() {
    return (
      <ul className="menu menu--header">
        <li className="menu-item"
          onClick={this.props.onOpenColumn.bind(
            this, COLUMN_TIMELINE, {subject: SUBJECT_MIXED, timelineType: TIMELINE_HOME})}
          >
          <IconFont className="menu-itemIcon" iconName="home" />
          <span className="menu-itemLabel"><_FM id="column.title.united_timeline_home" /></span>
        </li>

        <li className="menu-item"
          onClick={this.props.onOpenColumn.bind(
            this, COLUMN_TIMELINE, {subject: SUBJECT_MIXED, timelineType: TIMELINE_LOCAL})}>
          <IconFont className="menu-itemIcon" iconName="users" />
          <span className="menu-itemLabel"><_FM id="column.title.united_timeline_local" /></span>
        </li>

        <li className="menu-item"
          onClick={this.props.onOpenColumn.bind(
            this, COLUMN_TIMELINE, {subject: SUBJECT_MIXED, timelineType: TIMELINE_FEDERATION})}>
          <IconFont className="menu-itemIcon" iconName="globe" />
          <span className="menu-itemLabel"><_FM id="column.title.united_timeline_federation" /></span>
        </li>

        <li className="menu-item"
          onClick={this.props.onOpenColumn.bind(
            this, COLUMN_NOTIFICATIONS, {subject: SUBJECT_MIXED})}>
          <IconFont className="menu-itemIcon" iconName="bell" />
          <span className="menu-itemLabel"><_FM id="column.title.united_notifications" /></span>
        </li>

      </ul>
    )
  }

  onRenderAccountMenu(token) {
    const {account} = token
    const children = []

    // build menu
    if(token.isAlive()) {
      children.push(
        <li className="menu-description">
          <UserIconWithHost account={account} />
          <div className="menu-descriptionNote">
            <span className="user-displayName">{account.display_name}</span><br />
            <span className="user-account">{account.acct}</span>

            <div>
              {account.hasPublicKey && <span className="user-hasPublickey"><IconFont iconName="key" />pub</span>}
            </div>
            <div>
              {account.hasPrivateKey && <span className="user-hasPrivatekey"><IconFont iconName="key" />prv</span>}
            </div>
          </div>
        </li>,

        <li className="menu-item"
          onClick={this.props.onOpenColumn.bind(
            this, COLUMN_TIMELINE, {subject: account.acct, timelineType: TIMELINE_HOME})}>
          <IconFont className="menu-itemIcon" iconName="home" />
          <span><_FM id="column.title.timeline_home" /></span>
        </li>,

        <li className="menu-item"
          onClick={this.props.onOpenColumn.bind(
            this, COLUMN_TIMELINE, {subject: account.acct, timelineType: TIMELINE_LOCAL})}>
          <IconFont className="menu-itemIcon" iconName="users" />
          <span><_FM id="column.title.timeline_local" /></span>
        </li>,

        <li className="menu-item"
          onClick={this.props.onOpenColumn.bind(
            this, COLUMN_TIMELINE, {subject: account.acct, timelineType: TIMELINE_FEDERATION})}>
          <IconFont className="menu-itemIcon" iconName="globe" />
          <span><_FM id="column.title.timeline_federation" /></span>
        </li>,

        <li className="menu-item"
          onClick={this.props.onOpenColumn.bind(
            this, COLUMN_NOTIFICATIONS, {subject: account.acct})}>
          <IconFont className="menu-itemIcon" iconName="bell" />
          <span><_FM id="column.title.notifications" /></span>
        </li>,

        <li className="menu-item"
          onClick={this.props.onOpenColumn.bind(this, COLUMN_FRIENDS, {subject: account.acct})}>
          <IconFont className="menu-itemIcon" iconName="mail" />
          <span><_FM id="column.title.message" /></span>
        </li>,
      )
    } else {
      children.push(
        <li className="menu-description menu-description--badAccount">
          <strong>Host: {token.host}</strong>
          <p>
            Network communication error
          </p>
        </li>
      )
    }
    children.push(
      <li className="menu-item"
        onClick={this.props.onSignOut.bind(this, token)}>
        <IconFont className="menu-itemIcon" iconName="logout" />
        <span>Sign out</span>
      </li>
    )

    return React.createElement(
      'ul',
      {className: 'menu menu--header'},
      ...children
    )
  }

  /**
   * システムに関するMenu
   * @return {React.Component}
   */
  onRenderGlobalMenu() {
    return (
      <ul className="menu menu--global">
        <li className="menu-item"
          onClick={() => this.props.onShowSettings()}
        >
          <IconFont className="menu-itemIcon" iconName="cog" />
          <span><_FM id="preferences.title" /></span>
        </li>
      </ul>
    )
  }

  onTootFocus(e) {
    this.setState({isShowTootWindow: true})
  }

  onTootWindowClose() {
    this.setState({isShowTootWindow: false})
  }
}
