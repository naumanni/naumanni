import React from 'react'
import PropTypes from 'prop-types'

import {OAuthTokenArrayPropType} from 'src/propTypes'
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
  static propTypes = {
    tokens: OAuthTokenArrayPropType.isRequired,
    onStartAddAccount: PropTypes.func.isRequired,
    onOpenColumn: PropTypes.func.isRequired,
    onGenKey: PropTypes.func.isRequired,
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
            type="text" placeholder={TOOTFORM_PLACEHOLDER}
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

        <button className="naumanniDashboard-header-configButton">
          <IconFont iconName="cog" />
        </button>

      </header>
    )
  }

  /**
   * ヘッダに顔アイコンを書くよ
   * @param {OAuthToken} token
   * @return {React.Component}
   */
  renderAccount(token) {
    if(token.isAlive()) {
      // 正常Token
      return (
        <li key={token.address}>
          <DropdownMenuButton onRenderMenu={this.onRenderAccountMenu.bind(this, token)}>
            <UserIconWithHost account={token.account} />
          </DropdownMenuButton>
        </li>
      )
    } else {
      // 読み込みに失敗したToken
      return (
        <li key={token.address}>
          <DropdownMenuButton onRenderMenu={this.onRenderBadAccountMenu.bind(this, token)}>
            <div className="naumanniDashboard-header-badToken">×</div>
          </DropdownMenuButton>
        </li>
      )
    }
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
          <span className="menu-itemLabel">United Home timeline</span>
        </li>

        <li className="menu-item"
          onClick={this.props.onOpenColumn.bind(
            this, COLUMN_TIMELINE, {subject: SUBJECT_MIXED, timelineType: TIMELINE_LOCAL})}>
          <IconFont className="menu-itemIcon" iconName="users" />
          <span className="menu-itemLabel">United Local timeline</span>
        </li>

        <li className="menu-item"
          onClick={this.props.onOpenColumn.bind(
            this, COLUMN_TIMELINE, {subject: SUBJECT_MIXED, timelineType: TIMELINE_FEDERATION})}>
          <IconFont className="menu-itemIcon" iconName="globe" />
          <span className="menu-itemLabel">United Federated timeline</span>
        </li>

        <li className="menu-item"
          onClick={this.props.onOpenColumn.bind(
            this, COLUMN_NOTIFICATIONS, {subject: SUBJECT_MIXED})}>
          <IconFont className="menu-itemIcon" iconName="bell" />
          <span className="menu-itemLabel">United Notification</span>
        </li>

      </ul>
    )
  }

  onRenderAccountMenu(token) {
    const {account} = token

    return (
      <ul className="menu menu--header">
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
        </li>
        <li className="menu-item"
          onClick={this.props.onOpenColumn.bind(
            this, COLUMN_TIMELINE, {subject: account.acct, timelineType: TIMELINE_HOME})}>
          <IconFont className="menu-itemIcon" iconName="home" />
          <span>Home timeline</span>
        </li>

        <li className="menu-item"
          onClick={this.props.onOpenColumn.bind(
            this, COLUMN_TIMELINE, {subject: account.acct, timelineType: TIMELINE_LOCAL})}>
          <IconFont className="menu-itemIcon" iconName="users" />
          <span>Local timeline</span>
        </li>

        <li className="menu-item"
          onClick={this.props.onOpenColumn.bind(
            this, COLUMN_TIMELINE, {subject: account.acct, timelineType: TIMELINE_FEDERATION})}>
          <IconFont className="menu-itemIcon" iconName="globe" />
          <span>Federated timeline</span>
        </li>

        <li className="menu-item"
          onClick={this.props.onOpenColumn.bind(
            this, COLUMN_NOTIFICATIONS, {subject: account.acct})}>
          <IconFont className="menu-itemIcon" iconName="bell" />
          <span>Notifications</span>
        </li>

        <li className="menu-item"
          onClick={this.props.onOpenColumn.bind(this, COLUMN_FRIENDS, {subject: account.acct})}>
          <IconFont className="menu-itemIcon" iconName="mail" />
          <span>Message</span>
        </li>
      </ul>
    )
  }

  /**
   * 読み込みエラーになったTokenに関するMenu
   * @param {OAuthToken} token
   * @return {React.Component}
   */
  onRenderBadAccountMenu(token) {
    return (
      <ul className="menu menu--header menu--badAccount">
        <li className="menu-description">
          <strong>Host: {token.host}</strong>
          <p>
            Network communication error
          </p>
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
