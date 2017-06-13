import React from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage as _FM} from 'react-intl'
import {intlShape} from 'react-intl'

import {DropdownMenuButton, IconFont, UserIconWithHost} from 'src/pages/parts'
import {AccountPropType, OAuthTokenListPropType} from 'src/propTypes'
import {SafeNote, SafeLink} from 'src/pages/parts'


const RELATIONSHIP_MUTE = 'mute'
const RELATIONSHIP_BLOCK = 'block'
const RELATIONSHIP_MAP = {}
RELATIONSHIP_MAP[RELATIONSHIP_MUTE] = {icon: 'volume-off', label: 'mute', relationshipKey: 'muting'}
RELATIONSHIP_MAP[RELATIONSHIP_BLOCK] = {icon: 'block', label: 'block', relationshipKey: 'blocking'}

export default class UserDetail extends React.Component {
  static contextTypes = {
    intl: intlShape,
  }

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
      disable: muteDisable, text: muteText, activate: doMute,
    } = this.getVisualForRelationship(RELATIONSHIP_MUTE, token.acct)
    const {
      disable: blockDisable, text: blockText, activate: doBlock,
    } = this.getVisualForRelationship(RELATIONSHIP_BLOCK, token.acct)
    const {
      disable: followDisable, icon: followIcon, text: followText, doFollow,
    } = this.getVisualForFollowRelationship(token.acct)

    return (
      <div className="userDetail-actions">
        <button
          disabled={muteDisable}
          className="button button--primary"
          onClick={() => this.props.onToggleMuteClicked(token, account, doMute)}
        >
          <IconFont iconName={RELATIONSHIP_MAP[RELATIONSHIP_MUTE].icon} />{muteText}
        </button>

        <button
          disabled={blockDisable}
          className="button button--primary"
          onClick={() => this.props.onToggleBlockClicked(token, account, doBlock)}
        >
          <IconFont iconName={RELATIONSHIP_MAP[RELATIONSHIP_BLOCK].icon} />{blockText}
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
        <DropdownMenuButton onRenderMenu={this.onRenderRelationshipMenu.bind(this, RELATIONSHIP_MUTE)}>
          <button className="button button--primary"><_FM id="user_detail.label.mute" /></button>
        </DropdownMenuButton>

        <DropdownMenuButton onRenderMenu={this.onRenderRelationshipMenu.bind(this, RELATIONSHIP_BLOCK)}>
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

  onRenderRelationshipMenu(type) {
    const {tokens} = this.props
    const icon = RELATIONSHIP_MAP[type].icon
    const relationshipMethod = this.getRelationshipMethod(type)

    return (
      <ul className="menu menu--mute">

        {this.renderAllToggleRelationshipMenu(type)}

        {tokens.map((token) => {
          const {account} = token
          const {disable, text, activate} = this.getVisualForRelationship(type, account.acct)

          return (
            <li className={`menu-item ${disable ? 'is-disabled' : ''}`}
              key={account.acct}
              onClick={() => !disable && relationshipMethod && relationshipMethod(
                token, this.props.account, activate)}
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

  renderAllToggleRelationshipMenu(type) {
    const {formatMessage: _} = this.context.intl
    const {account, tokens} = this.props
    const {label} = RELATIONSHIP_MAP[type]
    const exceptMeTokens = tokens
      .filter(({account: {acct: me}}) => account.acct !== me)
    const actives = exceptMeTokens
      .filter((token) => {
        const {account: {acct}} = token
        const {activate} = this.getVisualForRelationship(type, acct)

        return !activate
      })

    let handler
    let text

    if(actives.size === exceptMeTokens.size) {
      // 全垢でMuteなりBlockなりしてる
      handler = this.onToggleRelationships.bind(this, type, actives, false)
      text = _({id: `user_detail.label.un${label}_all`})
    } else {
      const inactives = exceptMeTokens
        .filter((token) => !actives.find(({account: {acct}}) => token.account.acct === acct))

      handler = this.onToggleRelationships.bind(this, type, inactives, true)
      text = _({id: `user_detail.label.${label}_all`})
    }

    return (
      <li className="menu-item" onClick={handler}>
        <span className="menu-itemLabel">{text}</span>
      </li>
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
          const {disable, icon, text, doFollow} = this.getVisualForFollowRelationship(account.acct)

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

  getRelationshipMethod(type) {
    switch(type) {
    case RELATIONSHIP_MUTE: return this.props.onToggleMuteClicked
    case RELATIONSHIP_BLOCK: return this.props.onToggleBlockClicked
    default: return null
    }
  }

  getVisualForRelationship(type, me) {
    const {formatMessage: _} = this.context.intl
    const {account} = this.props
    const {label, relationshipKey} = RELATIONSHIP_MAP[type]
    const relationship = this.props.relationships[me]
    const isActive = relationship ? relationship[relationshipKey] : false

    let disable = false
    let text
    let activate

    if(account.acct === me) {
      disable = true
      text = <_FM id="user_detail.label.is_you" />
    } else if(isActive) {
      text = _({id: `user_detail.label.un${label}`})
      activate = false
    } else {
      text = _({id: `user_detail.label.${label}`})
      activate = true
    }

    return {disable, text, activate}
  }

  getVisualForFollowRelationship(me) {
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

  onToggleRelationships(type, tokens, activate) {
    const relationshipMethod = this.getRelationshipMethod(type)

    if(relationshipMethod) {
      tokens.forEach((token) => relationshipMethod(token, this.props.account, activate))
    }
  }
}
