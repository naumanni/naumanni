import React from 'react'
import PropTypes from 'prop-types'
import {is} from 'immutable'
import {FormattedRelative, FormattedMessage as _FM} from 'react-intl'

import {
  VISIBLITY_DIRECT, VISIBLITY_PRIVATE, VISIBLITY_UNLISTED, VISIBLITY_PUBLIC,
} from 'src/constants'
import {AcctPropType, AccountPropType, StatusPropType, OAuthTokenListPropType} from 'src/propTypes'
import {TimelineActionPropTypes} from 'src/controllers/TimelineActions'
import {isKeys, isKeysList} from 'src/utils'
import * as uiComponents from '../uiComponents'
import {IconButton} from 'src/pages/parts'


const PANEL_REPLY = 'ReplyPanel'
const PANEL_REBLOG = 'ReblogPanel'
const PANEL_FAVOURITE = 'FavouritePanel'


export default class TimelineStatus extends React.Component {
  static propTypes = {
    subject: AcctPropType,
    account: AccountPropType.isRequired,
    status: StatusPropType.isRequired,
    modifier: PropTypes.string,
    tokens: OAuthTokenListPropType,
    onLockStatus: PropTypes.func,
    ...TimelineActionPropTypes,
  }

  /**
   * @constructor
   */
  constructor(...args) {
    super(...args)

    const {status} = this.props

    this.state = {
      isShowMediaCover: status.sensitive,
      isContentOpen: status.hasSpoilerText ? false : true,
      isShowReplyPanel: false,
      isAnimatedReplyPanel: true,
      isShowFavouritePanel: false,
      isAnimatedFavouritePanel: true,
      isShowReblogPanel: false,
      isAnimatedReblogPanel: true,
    }
  }

  /**
   * @override
   */
  shouldComponentUpdate(nextProps, nextState) {
    return shouldComponentUpdateTimelineStatus(this.props, this.state, nextProps, nextState)
  }

  /**
   * @override
   */
  componentWillUnmount() {
    if(this.unlockTimelineHandler) {
      this.unlockTimelineHandler()
      delete this.unlockTimelineHandler
    }
  }
  /**
   * @override
   */
  render() {
    const {UserIconWithHost, UserDisplayName, UserAcct} = uiComponents
    const {children, status, account, modifier} = this.props
    const {isShowReplyPanel} = this.state
    const onClickAvatar = this.onClickAvatar.bind(this, account)

    return (
      <article className={`status ${modifier ? `status--${modifier}` : ''}`}>

        {children}

        <div className="status-row status-content">
          <div className="status-rowLeft">
            <div className="status-avatar">
              <UserIconWithHost account={account} onClick={onClickAvatar} />
            </div>
            <div className="status-visibility">
              <VisibilityIcon visibility={status.visibility} />
            </div>
          </div>
          <div className="status-rowRight">

            <div className="status-info">
              <div className="status-author">
                <UserDisplayName account={account} onClick={onClickAvatar} />
                <UserAcct account={account} onClick={onClickAvatar} />
              </div>
              <a className="status-createdAt"
                 href={status.url}
                 target="_blank"
                 alt={status.created_at}><FormattedRelative value={status.createdAt.toDate()} />
              </a>
            </div>

            {this.renderBody()}
            {this.renderMedia()}
            {this.renderActions()}

          </div>
        </div>

        {isShowReplyPanel && this.renderReplyPanel()}
        {this.state.isShowReblogPanel && this.renderReblogPanel()}
        {this.state.isShowFavouritePanel && this.renderFavPanel()}

      </article>
    )
  }

  renderBody() {
    const {
      SafeContent,
    } = require('../uiComponents')
    const {status} = this.props
    const {isContentOpen} = this.state
    const statusBodyClass = ['status-body']

    if(status.spoilerText.length) {
      statusBodyClass.push(
        'has-spoilerText',
        isContentOpen ? 'is-contentOpen' : 'is-contentClose'
      )
    }

    return (
      <div className={statusBodyClass.join(' ')}>
        {this.renderSpoilerText()}
        {isContentOpen && (
          <div className="status-content">
            <SafeContent
              parsedContent={status.parsedContent}
              onClickHashTag={::this.onClickHashTag}
              {...this.props} />
          </div>
        )}
      </div>
    )
  }

  renderSpoilerText() {
    const {status} = this.props
    const {isContentOpen} = this.state

    if(!status.hasSpoilerText)
      return null

    return (
      <div className="status-spoilerText">
        {status.spoilerText}
        <a className="status-contentOpener"
          onClick={() => this.setState({isContentOpen: !isContentOpen})}>
          {isContentOpen
            ? <_FM id="timeline_status.label.content_close" />
            : <_FM id="timeline_status.label.content_more" />}
        </a>
      </div>
    )
  }

  renderMedia() {
    const {IconFont} = uiComponents
    const {status} = this.props
    const {isShowMediaCover} = this.state
    const mediaList = status.media_attachments
    if(mediaList.isEmpty())
      return null

    const className = [
      'status-mediaList',
      `status-mediaList${mediaList.size}`,
    ]
    if(status.sensitive) {
      className.push('is-sensitive')
    }

    return (
      <div className={className.join(' ')}>
        {mediaList.map((media, idx) => (
          <a key={media.preview_url}
            className="status-media"
            style={{backgroundImage: `url(${media.preview_url})`}}
            target="_blank"
            href={media.url}
            onClick={this.onClickMedia.bind(this, mediaList, idx)}
            />
        ))}

        {isShowMediaCover && (
          <div className="status-mediaListCover" onClick={::this.onClickMediaCover}>
            <p>
              <_FM id="timeline_status.label.sensitive_content" /><br />
              <span className="sub"><_FM id="timeline_status.label.click_to_view" /></span>
            </p>
          </div>
        )}
        {!isShowMediaCover && (
          <button className="status-buttonShowMediaListCover" onClick={::this.onClickMediaCover}>
            <IconFont iconName="eye-off" />
          </button>
        )}
      </div>
    )
  }

  renderActions() {
    const buttons = this.renderActionButtons()

    return React.createElement('div', {className: 'status-actions'}, ...buttons)
  }

  renderActionButtons() {
    const {DropdownMenuButton, IconFont} = uiComponents
    const {status} = this.props
    const {isShowReplyPanel} = this.state

    return [
      <button
        key="replyButton"
        className={`status-actionReply ${isShowReplyPanel ? 'is-active' : ''}`}
        onClick={::this.onClickToggleReply}>
        <IconFont iconName="reply" />
      </button>,

      status.canReblog()
        ? this.renderReblogButton()
        : <VisibilityIcon visibility={status.visibility} className="is-inactive" />,

      this.renderFavButton(),

      <DropdownMenuButton
        key="etcButton"
        modifier="statusActionMenu" onRenderMenu={::this.onRenderStatusMenu}
        style={{display: 'none'}}
      >
        <IconFont iconName="dot-3" />
      </DropdownMenuButton>,
    ]
  }

  renderReblogButton() {
    const {status, tokens} = this.props
    const on = tokens.find((token) => status.isRebloggedAt(token.acct)) ? true : false

    return <IconButton
      active={on}
      className={'status-actionReblog'}
      iconName={'reblog'}
      onClick={this.onClickReblog.bind(this, on)} />
  }

  renderFavButton() {
    const {status, tokens} = this.props
    const on = tokens.find((token) => status.isFavouritedAt(token.acct)) ? true : false

    return <IconButton
      active={on}
      className={'status-actionFavorite'}
      iconName={'star-filled'}
      onClick={this.onClickFav.bind(this, on)} />
  }

  renderReplyPanel() {
    const {TootForm} = uiComponents
    const {account, tokens, subject, status: {visibility}} = this.props
    const {isAnimatedReplyPanel} = this.state

    // デフォルトの返信元。 親Timelineの主題か、Statusと同じホストの最初のアカウントから選ぶ
    let sendFrom = subject
      ? [subject]
      : tokens.filter((t) => t.host === account.instance).map((t) => t.acct)

    return (
      <div className={`status-replyPanel ${isAnimatedReplyPanel ? 'off' : ''}`}>
        <div>
          <TootForm {...this.props}
            onSend={::this.onSendReply}
            onClose={::this.onCloseReplyPanel}
            initialSendFrom={sendFrom}
            initialContent={`@${account.acct} `}
            initialVisibility={visibility}
            />
        </div>
      </div>
    )
  }

  renderReblogPanel() {
    const {IconFont, UserIconWithHost} = uiComponents
    const {tokens, status} = this.props
    const {isAnimatedReblogPanel} = this.state
    // publicであればどのアカウントからでもFav/Boostできる
    const isPublic = status.canReblog()

    return (
      <div className={`status-reblogPanel ${isAnimatedReblogPanel ? 'off' : ''}`}>
        <div>
          <ul>
            {tokens.map((token) => {
              const {account} = token
              const disabled = isPublic ? false : (status.getIdByHost(token.host) ? false : true)
              const on = status.isRebloggedAt(token.acct) ? true : false

              return (
                <li className={`${disabled ? 'is-disabled' : ''} ${on ? 'on' : ''}`}
                  key={token.acct}
                  onClick={(e) => !disabled && this.onReblogStatus(token, status, !on)}
                >
                  <IconFont iconName="reblog" className={on ? 'is-active' : ''} />
                  <UserIconWithHost account={account} size="mini" />
                  <span className="acct">{account.acct}</span>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    )
  }

  renderFavPanel() {
    const {IconFont, UserIconWithHost} = uiComponents
    const {tokens, status} = this.props
    const {isAnimatedFavouritePanel} = this.state
    // publicであればどのアカウントからでもFav/Boostできる
    const isPublic = status.canReblog()

    return (
      <div className={`status-favPanel ${isAnimatedFavouritePanel ? 'off' : ''}`}>
        <div>
          <ul>
            {tokens.map((token) => {
              const {account} = token
              const disabled = isPublic ? false : (status.getIdByHost(token.host) ? false : true)
              const on = status.isFavouritedAt(token.acct) ? true : false

              return (
                <li className={`${disabled ? 'is-disabled' : ''} ${on ? 'on' : ''}`}
                  key={token.acct}
                  onClick={(e) => !disabled && this.onFavouriteStatus(token, status, !on)}
                >
                  <IconFont iconName="star-filled" className={on ? 'is-active' : ''} />
                  <UserIconWithHost account={account} size="mini" />
                  <span className="acct">{account.acct}</span>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    )
  }

  renderStatusMenuItems() {
    return []
  }

  // callbacks
  onClickAvatar(account, e) {
    e.preventDefault()

    this.props.onAvatarClicked(account)
  }

  onRenderStatusMenu(entry) {
    const menuItems = this.renderStatusMenuItems()

    menuItems.sort((a, b) => {
      const aw = a.weight || 100
      const bw = b.weight || 100
      if(aw > bw)
        return 1
      else if(aw < bw)
        return -1
      else
        return 0
    })

    return (
      <ul className="menu menu--status">
        {menuItems.map((menuItem) => menuItem.content || menuItem)}
      </ul>
    )
  }

  onClickMediaCover() {
    this.setState({isShowMediaCover: !this.state.isShowMediaCover})
  }

  onClickToggleReply(e) {
    e.preventDefault()
    this.togglePanel(PANEL_REPLY)
  }

  onClickToggleReblogPanel(e) {
    e.preventDefault()
    this.togglePanel(PANEL_REBLOG)
  }

  onClickToggleFavouritePanel(e) {
    e.preventDefault()
    this.togglePanel(PANEL_FAVOURITE)
  }

  onReblogStatus(token, status, on) {
    this.props.onReblogStatus(token, status, on)
    this.hideAllPanel()
  }

  onFavouriteStatus(token, status, on) {
    this.props.onFavouriteStatus(token, status, on)
    this.hideAllPanel()
  }

  togglePanel(panel) {
    const isShowKey = `isShow${panel}`

    if(this.state[isShowKey]) {
      // hide panel
      this.showHidePanel(false, panel)
      if(this.unlockTimelineHandler) {
        this.unlockTimelineHandler()
        delete this.unlockTimelineHandler
      }
    } else {
      // show panel
      if(!this.unlockTimelineHandler) {
        this.unlockTimelineHandler = this.props.onLockStatus && this.props.onLockStatus()
      }
      this.hideAllPanel()
        .then(() => this.showHidePanel(true, panel))
    }
  }

  hideAllPanel() {
    return Promise.all([
      this.showHidePanel(false, PANEL_REPLY),
      this.showHidePanel(false, PANEL_REBLOG),
      this.showHidePanel(false, PANEL_FAVOURITE),
    ])
  }

  showHidePanel(show, panel) {
    const isShowKey = `isShow${panel}`

    if(this.state[isShowKey] === show)
      return Promise.resolve()

    return new Promise((resolve) => {
      if(show) {
        this.setState(
          {[`isShow${panel}`]: true, [`isAnimated${panel}`]: true},
          () => this.setState({[`isAnimated${panel}`]: false}, () => resolve())
        )
      } else {
        this.setState(
          {[`isShow${panel}`]: true, [`isAnimated${panel}`]: true},
          () => setTimeout(() => this.setState({[`isShow${panel}`]: false}, () => resolve()), 100)
        )
      }
    })
  }

  onClickMedia(mediaList, idx, e) {
    e.preventDefault()

    this.props.onClickMedia(mediaList, idx)
  }

  /**
   * TootForm用のonSendをoverrideする。
   * Send完了時にTootFormを閉じたい
   * @return {Promise}
   */
  onSendReply(...args) {
    return this.props.onSendReply(this.props.status, ...args)
      .then(() => {
        this.showHidePanel(false, PANEL_REPLY)
      })
  }

  onCloseReplyPanel() {
    this.showHidePanel(false, PANEL_REPLY)
  }

  onClickHashTag(tag, e) {
    e.preventDefault()
    this.props.onClickHashTag(tag)
  }

  onClickReblog(on, e) {
    const {status, tokens} = this.props

    tokens.size === 1
      ? this.props.onReblogStatus(this, tokens.get(0), status, !on)
      : this.onClickToggleReblogPanel(e)
  }

  onClickFav(on, e) {
    const {status, tokens} = this.props

    tokens.size === 1
      ? this.props.onFavouriteStatus(this, tokens.get(0), status, !on)
      : this.onClickToggleFavouritePanel(e)
  }
}


function VisibilityIcon({visibility, className}) {
  const {IconFont} = uiComponents

  let iconName
  switch(visibility) {
  case VISIBLITY_DIRECT:
    iconName = 'mail'
    break
  case VISIBLITY_PRIVATE:
    iconName = 'lock'
    break
  case VISIBLITY_UNLISTED:
    iconName = 'lock-open'
    break
  case VISIBLITY_PUBLIC:
    iconName = 'globe'
    break
  }

  return <IconFont className={className} iconName={iconName} />
}


/**
 * TimelineStatusのshouldComponentUpdateを切り出したもの
 * TimelineStatusContainerでも使うので
 * @param {object} prevProps
 * @param {object} prevState
 * @param {object} nextProps
 * @param {object} nextState
 * @return {bool}
 */
function shouldComponentUpdateTimelineStatus(prevProps, prevState, nextProps, nextState) {
  if(!TimelineStatus.propDeepKeys) {
    // uiComponentsのimport順の関係で、遅延初期化
    const {UserIconWithHost, UserDisplayName, UserAcct} = uiComponents

    // propsの中でrendering対象のkey
    TimelineStatus.propDeepKeys = {
      'account': new Set([
        'acct',
        ...UserIconWithHost.propDeepKeys.account,
        ...UserDisplayName.propDeepKeys.account,
        ...UserAcct.propDeepKeys.account,
      ]),
      'status': new Set([
        'sensitive', 'spoiler_text', 'visibility', 'url', 'created_at', 'content', 'mentions',
        'reblogged_by_acct', 'favourited_by_acct',
        // 'media_attachments',   // deepに比べる
      ]),
      'media_attachments': new Set(['url', 'preview_url']),
    }
  }

  if(
    !is(prevProps.subject, nextProps.subject) ||
    !isKeys(TimelineStatus.propDeepKeys.account, prevProps.account, nextProps.account) ||
    !isKeys(TimelineStatus.propDeepKeys.status, prevProps.status, nextProps.status) ||
    !isKeysList(
      TimelineStatus.propDeepKeys.media_attachments,
      prevProps.status.media_attachments, nextProps.status.media_attachments) ||
    !is(prevProps.modifier, nextProps.modifier) ||
    !is(prevProps.tokens, nextProps.tokens) ||
    !Object.keys(nextState || {}).every((s) => is(nextState[s], prevState[s]))
  ) {
    return true
  }
  return false
}
