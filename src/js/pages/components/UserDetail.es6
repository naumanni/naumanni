import React from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage as _FM} from 'react-intl'

import {DropdownMenuButton, IconFont, UserIconWithHost} from 'src/pages/parts'
import {AccountPropType, OAuthTokenListPropType} from 'src/propTypes'
import {SafeNote, SafeLink} from 'src/pages/parts'


export default class UserDetail extends React.Component {
  static propTypes = {
    account: AccountPropType.isRequired,
    tokens: OAuthTokenListPropType.isRequired,
    relationships: PropTypes.object.isRequired,
    onOpenTalkClicked: PropTypes.func.isRequired,
    onToggleFollowClicked: PropTypes.func.isRequired,
  }

  /**
   * @override
   */
  render() {
    const {account, tokens} = this.props
    const headerStyle = {}

    if(account.header && account.header.startsWith('http'))
      headerStyle.backgroundImage = `\
linear-gradient(to bottom, rgba(255,255,255,0) 0%,rgba(255,255,255,1) 100%),
url(${account.header})`

    return (
      <div className="userDetail" style={headerStyle}>
        {tokens.size == 1
          ? this.renderActionsSingleToken()
          : this.renderActionsMultiTokens()
        }

        <div className="userDetail-header">
          <UserIconWithHost account={account} size="large" />
          <div className="user-displayName">{account.display_name}</div>
          <div className="user-acct">{account.acct}{account.locked && <IconFont iconName="lock" />}</div>
          <div><SafeLink href={account.url} target="_blank">{account.url}</SafeLink></div>
          <div><SafeNote parsedNote={account.parsedNote} /></div>
        </div>
      </div>
    )
  }

  renderActionsSingleToken() {
    const {account} = this.props
    const token = this.props.tokens.get(0)

    // 自分では?
    if(account.acct === token.acct) {
      return
    }

    const {
      disable: muteDisable, text: muteText, doMute,
    } = this.getVisualForMuteRelationship(token.acct)
    const {
      disable: blockDisable, text: blockText, doBlock,
    } = this.getVisualForBlockRelationship(token.acct)
    const {
      disable: followDisable, icon: followIcon, text: followText, doFollow,
    } = this.getVisualForRelationship(token.acct)

    return (
      <div className="userDetail-actions">
        <button
          disabled={muteDisable}
          className="button button--primary"
          onClick={() => this.props.onToggleMuteClicked(token, account, doMute)}
        >
          {/* TODO: IconFont */}{muteText}
        </button>

        <button
          disabled={blockDisable}
          className="button button--primary"
          onClick={() => this.props.onToggleBlockClicked(token, account, doBlock)}
        >
          {/* TODO: IconFont */}{blockText}
        </button>

        <button
          style={{display: 'none'}}
          className="button button--primary"
          onClick={() => this.props.onClickReport(token, account)}
        >
          <IconFont iconName="report" /> <_FM id="user_detail.label.report" />
        </button>

        <button
          className="button"
          onClick={() => this.props.onOpenTalkClicked(token, account)}
        >
          <IconFont iconName="talk" /> <_FM id="user_detail.label.talk" />
        </button>

        <button
          disabled={followDisable}
          className="button button--primary"
          onClick={() => this.props.onToggleFollowClicked(token, account, doFollow)}
        >
          <IconFont iconName={followIcon} /> {followText}
        </button>
      </div>
    )
  }

  renderActionsMultiTokens() {
    return (
      <div className="userDetail-actions">
        <DropdownMenuButton onRenderMenu={::this.onRenderMuteMenu}>
          <button className="button button--primary"><_FM id="user_detail.label.mute" /></button>
        </DropdownMenuButton>

        <DropdownMenuButton onRenderMenu={::this.onRenderBlockMenu}>
          <button className="button button--primary"><_FM id="user_detail.label.block" /></button>
        </DropdownMenuButton>

        {false &&  // TODO:
          <DropdownMenuButton onRenderMenu={::this.onRenderReportMenu}>
            <button className="button button--primary"><_FM id="user_detail.label.report" /></button>
          </DropdownMenuButton>
        }

        <DropdownMenuButton onRenderMenu={::this.onRenderTalkMenu}>
          <button className="button"><IconFont iconName="talk" /> <_FM id="user_detail.label.talk" /></button>
        </DropdownMenuButton>

        <DropdownMenuButton onRenderMenu={::this.onRenderFollowMenu}>
          <button className="button button--primary">
            <IconFont iconName="user-plus" /> <_FM id="user_detail.label.follow" />
          </button>
        </DropdownMenuButton>
      </div>
    )
  }

  onRenderMuteMenu() {
    const {tokens} = this.props

    return (
      <ul className="menu menu--mute">
        <li className="menu-item" onClick={::this.onClickMuteAll}>
          <span className="menu-itemLabel">
            <_FM id="user_detail.label.mute_all" />
          </span>
        </li>
        {tokens.map((token) => {
          const {account} = token
          const {disable, text, doMute} = this.getVisualForMuteRelationship(account.acct)

          return (
            <li className={`menu-item ${disable ? 'is-disabled' : ''}`}
              key={account.acct}
              onClick={() => !disable && this.props.onToggleMuteClicked(token, this.props.account, doMute)}
            >
              {/* TODO: IconFont */}
              <UserIconWithHost account={account} size="mini" />
              <span className="menu-itemLabel">
                {account.acct}<br />{text}
              </span>
            </li>
          )
        })}
      </ul>
    )
  }

  onRenderBlockMenu() {
    const {tokens} = this.props

    return (
      <ul className="menu menu--block">
        <li className="menu-item" onClick={::this.onClickBlockAll}>
          <span className="menu-itemLabel">
            <_FM id="user_detail.label.block_all" />
          </span>
        </li>
        {tokens.map((token) => {
          const {account} = token
          const {disable, text, doBlock} = this.getVisualForBlockRelationship(account.acct)

          return (
            <li className={`menu-item ${disable ? 'is-disabled' : ''}`}
              key={account.acct}
              onClick={() => !disable && this.props.onToggleBlockClicked(token, this.props.account, doBlock)}
            >
              {/* TODO: IconFont */}
              <UserIconWithHost account={account} size="mini" />
              <span className="menu-itemLabel">
                {account.acct}<br />{text}
              </span>
            </li>
          )
        })}
      </ul>
    )
  }

  onRenderReportMenu() {
    // TODO:
  }

  onRenderTalkMenu() {
    const {tokens} = this.props

    return (
      <ul className="menu menu--talk">
        {tokens.map((token) => {
          const {account} = token

          if(account.acct !== this.props.account.acct) {
            return (
              <li className="menu-item"
                key={account.acct}
                onClick={() => this.props.onOpenTalkClicked(token, this.props.account)}
              >
                <UserIconWithHost account={account} size="mini" /> {account.acct}
              </li>
            )
          }
        })}
      </ul>
    )
  }

  onRenderFollowMenu() {
    const {tokens} = this.props

    return (
      <ul className="menu menu--follow">
        {tokens.map((token) => {
          const {account} = token
          const {disable, icon, text, doFollow} = this.getVisualForRelationship(account.acct)

          return (
            <li className={`menu-item ${disable ? 'is-disabled' : ''}`}
              key={account.acct}
              onClick={() => !disable && this.props.onToggleFollowClicked(token, this.props.account, doFollow)}
            >
              <IconFont iconName={icon} />
              <UserIconWithHost account={account} size="mini" />
              <span className="menu-itemLabel">
                {account.acct}<br />{text}
              </span>
            </li>
          )
        })}
      </ul>
    )
  }

  getVisualForMuteRelationship(me) {
    const {account} = this.props
    const relationship = this.props.relationships[me]
    const isMuting = relationship ? relationship.muting : false

    let disable = false
    // let icon  // TODO:
    let text
    let doMute

    if(account.acct === me) {
      disable = true
      text = <_FM id="user_detail.label.is_you" />
    } else if(isMuting) {
      text = <_FM id="user_detail.label.unmute" />
      doMute = false
    } else {
      text = <_FM id="user_detail.label.mute" />
      doMute = true
    }

    return {disable, text, doMute}
  }

  getVisualForBlockRelationship(me) {
    const {account} = this.props
    const relationship = this.props.relationships[me]
    const isBlocking = relationship ? relationship.blocking : false

    let disable = false
    // let icon  // TODO:
    let text
    let doBlock

    if(account.acct === me) {
      disable = true
      text = <_FM id="user_detail.label.is_you" />
    } else if(isBlocking) {
      text = <_FM id="user_detail.label.unblock" />
      doBlock = false
    } else {
      text = <_FM id="user_detail.label.block" />
      doBlock = true
    }

    return {disable, text, doBlock}
  }

  getVisualForRelationship(me) {
    const {account} = this.props
    const relationship = this.props.relationships[me]
    const isFollowing = relationship ? relationship.following : false
    const isRequested = relationship ? relationship.requested : false

    let disable = false
    let icon
    let text
    let doFollow

    if(account.acct === me) {
      disable = true
      icon = 'meh'
      text = <_FM id="user_detail.label.is_you" />
    } else if(isRequested) {
      if(isFollowing) {
        console.warn('relationshipがrequestedなのにfollowing!!', relationship)
      }
      disable = true
      icon = 'hourglass-o'
      text = <_FM id="user_detail.label.requesting" />
    } else if(isFollowing) {
      icon = 'user-times'
      text = <_FM id="user_detail.label.unfollow" />
      doFollow = false
    } else {
      icon = 'user-plus'
      text = account.locked ? <_FM id="user_detail.label.request" /> : <_FM id="user_detail.label.do_follow" />
      doFollow = true
    }

    return {disable, icon, text, doFollow}
  }

  onClickMuteAll() {
    const {account, tokens, onToggleMuteClicked} = this.props

    tokens.forEach((token) => onToggleMuteClicked(token, account, true))
  }

  onClickBlockAll() {
    const {account, tokens, onToggleBlockClicked} = this.props

    tokens.forEach((token) => onToggleBlockClicked(token, account, true))
  }
}
