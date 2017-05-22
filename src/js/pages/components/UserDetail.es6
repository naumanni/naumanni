import React from 'react'
import PropTypes from 'prop-types'

import {DropdownMenuButton, IconFont, UserIconWithHost} from 'src/pages/parts'
import {AccountPropType, OAuthTokenArrayPropType} from 'src/propTypes'
import {SafeNote, SafeLink} from 'src/pages/parts'


export default class UserDetail extends React.Component {
  static propTypes = {
    account: AccountPropType.isRequired,
    tokens: OAuthTokenArrayPropType.isRequired,
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
        {tokens.length == 1
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
    const token = this.props.tokens[0]

    // 自分では?
    if(account.acct === token.acct) {
      return
    }

    const {disable, icon, text, doFollow} = this.getVisualForRelationship(token.acct)

    return (
      <div className="userDetail-actions">
        <button
          className="button"
          onClick={() => this.props.onOpenTalkClicked(token, account)}
        >
          <IconFont iconName="talk" /> トーク
        </button>
        <button
          disabled={disable}
          className="button button--primary"
          onClick={() => this.props.onToggleFollowClicked(token, account, doFollow)}
        >
          <IconFont iconName={icon} /> {text}
        </button>
      </div>
    )
  }

  renderActionsMultiTokens() {
    return (
      <div className="userDetail-actions">
        <DropdownMenuButton onRenderMenu={::this.onRenderTalkMenu}>
          <button className="button"><IconFont iconName="talk" /> トーク</button>
        </DropdownMenuButton>
        <DropdownMenuButton onRenderMenu={::this.onRenderFollowMenu}>
          <button className="button button--primary"><IconFont iconName="user-plus" /> フォロー</button>
        </DropdownMenuButton>
      </div>
    )
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
      text = 'あなたです!'
    } else if(isRequested) {
      if(isFollowing) {
        console.warn('relationshipがrequestedなのにfollowing!!', relationship)
      }
      disable = true
      icon = 'hourglass-o'
      text = 'リクエスト中...'
    } else if(isFollowing) {
      icon = 'user-times'
      text = 'フォローを解除する'
      doFollow = false
    } else {
      icon = 'user-plus'
      text = account.locked ? 'フォローを申請する' : 'フォローする'
      doFollow = true
    }

    return {disable, icon, text, doFollow}
  }
}
