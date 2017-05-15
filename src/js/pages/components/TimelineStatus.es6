import React from 'react'
import PropTypes from 'prop-types'


import {
  VISIBLITY_DIRECT, VISIBLITY_PRIVATE, VISIBLITY_UNLISTED, VISIBLITY_PUBLIC,
} from 'src/constants'
import TootPanel from './TootPanel'
import {AcctPropType, AccountPropType, StatusPropType} from 'src/propTypes'
import {TimelineActionPropTypes} from 'src/controllers/TimelineActions'
import {DropdownMenuButton, IconFont, UserIconWithHost, SafeContent, UserDisplayName, UserAcct} from '../parts'


export default class TimelineStatus extends React.Component {
  static propTypes = {
    subject: AcctPropType,
    account: AccountPropType.isRequired,
    status: StatusPropType.isRequired,
    reblog: StatusPropType,
    reblogAccount: AccountPropType,
    modifier: PropTypes.string,
    tokens: TootPanel.propTypes.tokens,
    onLockStatus: PropTypes.func,
    ...TimelineActionPropTypes,
  }

  /**
   * @constructor
   */
  constructor(...args) {
    super(...args)

    const {status, reblog} = this.props
    const mainStatus = reblog || status

    this.state = {
      isShowMediaCover: mainStatus.sensitive,
      isContentOpen: mainStatus.hasSpoilerText ? false : true,
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
    const {status, reblog, account, reblogAccount, modifier} = this.props
    require('assert')(!reblog || (reblog && reblogAccount))
    const {isContentOpen, isShowReplyPanel} = this.state
    const mainStatus = reblog || status
    const mainAccount = reblogAccount || account
    const statusBodyClass = ['status-body']
    const onClickAvatar = this.onClickAvatar.bind(this, account)

    if(mainStatus.spoilerText.length) {
      statusBodyClass.push(
        'has-spoilerText',
        isContentOpen ? 'is-contentOpen' : 'is-contentClose'
      )
    }

    return (
      <article className={`status ${modifier ? `status--${modifier}` : ''}`}>

        {reblog && (
          <div className="status-row status-reblogFrom">
            <div className="status-rowLeft"><IconFont iconName="reblog" /></div>
            <div className="status-rowRight">
              <a onClick={onClickAvatar}>{account.display_name}</a>さんにブーストされました
            </div>
          </div>
        )}

        <div className="status-row status-content">
          <div className="status-rowLeft">
            <div className="status-avatar">
              <UserIconWithHost account={mainAccount} onClick={onClickAvatar} />
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
                 href={mainStatus.url}
                 target="_blank"
                 alt={mainStatus.created_at}>{mainStatus.createdAt.fromNow()}
              </a>
            </div>

            <div className={statusBodyClass.join(' ')}>
              {this.renderSpoilerText()}
              {isContentOpen && (
                <div className="status-content">
                  <SafeContent parsedContent={mainStatus.parsedContent} {...this.props} />
                </div>
              )}
            </div>

            {this.renderMedia()}

            <div className="status-actions">
              <button
                className={`status-actionReply ${isShowReplyPanel ? 'is-active' : ''}`}
                onClick={::this.onClickToggleReply}>
                <IconFont iconName="reply" />
              </button>

              {status.canReblog()
                ? this.renderReblogButton()
                : <VisibilityIcon visibility={status.visibility} className="is-inactive" />
              }

              {this.renderFavButton()}

              <button className="status-actionMenu" style={{display: 'none'}}>
                <DropdownMenuButton onRenderMenu={::this.onRenderStatusMenu}>
                  <IconFont iconName="dot-3" />
                </DropdownMenuButton>
              </button>
            </div>

          </div>
        </div>

        {isShowReplyPanel && this.renderReplyPanel()}
        {this.state.isShowReblogPanel && this.renderReblogPanel()}
        {this.state.isShowFavouritePanel && this.renderFavPanel()}

      </article>
    )
  }

  renderSpoilerText() {
    const {status} = this.props
    const {isContentOpen} = this.state
    const mainStatus = status.reblog || status

    if(!mainStatus.hasSpoilerText)
      return null

    return (
      <div className="status-spoilerText">
        {mainStatus.spoilerText}
        <a className="status-contentOpener"
          onClick={() => this.setState({isContentOpen: !isContentOpen})}>
          {isContentOpen ? '閉じる' : 'もっと見る...'}
        </a>
      </div>
    )
  }

  renderMedia() {
    const {status, reblog} = this.props
    const {isShowMediaCover} = this.state
    const mainStatus = reblog || status
    const mediaList = mainStatus.media_attachments
    if(!mediaList.length)
      return null

    const className = [
      'status-mediaList',
      `status-mediaList${mediaList.length}`,
    ]
    if(mainStatus.sensitive) {
      className.push('is-sensitive')
    }

    return (
      <div className={className.join(' ')}>
        {mediaList.map((media) => (
          <a key={media.id}
            className="status-media"
            style={{backgroundImage: `url(${media.preview_url})`}}
            target="_blank"
            href={media.url}
            onClick={this.onClickMedia.bind(this, media)}
            />
        ))}

        {isShowMediaCover && (
          <div className="status-mediaListCover" onClick={::this.onClickMediaCover}>
            <p>
              不適切なコンテンツ<br />
              <span className="sub">クリックして表示</span>
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

  renderReblogButton() {
    const {status, tokens} = this.props
    const on = tokens.find((token) => status.isRebloggedAt(token.acct)) ? true : false

    const onClickHandler =
      tokens.length === 1
        ? this.props.onReblogStatus.bind(this, tokens[0], status, !on)
        : ::this.onClickToggleReblogPanel

    return (
      <button className="status-actionReblog" onClick={onClickHandler}>
        <IconFont iconName="reblog" className={on ? 'is-active' : ''} />
      </button>
    )
  }

  renderFavButton() {
    const {status, tokens} = this.props
    const on = tokens.find((token) => status.isFavouritedAt(token.acct)) ? true : false

    const onClickHandler =
      tokens.length === 1
        ? this.props.onFavouriteStatus.bind(this, tokens[0], status, !on)
        : ::this.onClickToggleFavouritePanel

    return (
      <button className="status-actionFavorite" onClick={onClickHandler}>
        <IconFont iconName="star-filled" className={on ? 'is-active' : ''} />
      </button>
    )
  }

  renderReplyPanel() {
    const {account, tokens, subject} = this.props
    const {isAnimatedReplyPanel} = this.state

    // デフォルトの返信元。 親Timelineの主題か、Statusと同じホストの最初のアカウントから選ぶ
    let sendFrom = subject
      ? [subject]
      : tokens.filter((t) => t.host === account.instance).map((t) => t.acct)

    return (
      <div className={`status-replyPanel ${isAnimatedReplyPanel ? 'off' : ''}`}>
        <div>
          <TootPanel {...this.props}
            onSend={::this.onSendReply}
            initialSendFrom={sendFrom}
            initialContent={`@${account.acct} `}
            />
        </div>
      </div>
    )
  }

  renderReblogPanel() {
    const {tokens, status} = this.props
    const {isAnimatedReblogPanel} = this.state

    return (
      <div className={`status-reblogPanel ${isAnimatedReblogPanel ? 'off' : ''}`}>
        <div>
          <ul>
            {tokens.map((token) => {
              const {account} = token
              const disabled = status.getIdByHost(token.host) ? false : true
              const on = status.isRebloggedAt(token.acct) ? true : false

              return (
                <li className={`${disabled ? 'is-disabled' : ''} ${on ? 'on' : ''}`}
                  key={token.acct}
                  onClick={(e) => !disabled && this.props.onReblogStatus(token, status, !on)}
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
    const {tokens, status} = this.props
    const {isAnimatedFavouritePanel} = this.state

    return (
      <div className={`status-favPanel ${isAnimatedFavouritePanel ? 'off' : ''}`}>
        <div>
          <ul>
            {tokens.map((token) => {
              const {account} = token
              const disabled = status.getIdByHost(token.host) ? false : true
              const on = status.isFavouritedAt(token.acct) ? true : false

              return (
                <li className={`${disabled ? 'is-disabled' : ''} ${on ? 'on' : ''}`}
                  key={token.acct}
                  onClick={(e) => !disabled && this.props.onFavouriteStatus(token, status, !on)}
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

  // callbacks
  onClickAvatar(account, e) {
    e.preventDefault()

    this.props.onAvatarClicked(account)
  }

  onRenderStatusMenu(entry) {
    return (
      <div>hogehoge</div>
    )
  }

  onClickMediaCover() {
    this.setState({isShowMediaCover: !this.state.isShowMediaCover})
  }

  onClickToggleReply(e) {
    e.preventDefault()
    this.togglePanel('ReplyPanel')
  }

  onClickToggleReblogPanel(e) {
    e.preventDefault()
    this.togglePanel('ReblogPanel')
  }

  onClickToggleFavouritePanel(e) {
    e.preventDefault()
    this.togglePanel('FavouritePanel')
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
      this.showHidePanel(false, 'ReplyPanel'),
      this.showHidePanel(false, 'ReblogPanel'),
      this.showHidePanel(false, 'FavouritePanel'),
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

  onClickMedia(media, e) {
    e.preventDefault()

    this.props.onClickMedia(media)
  }

  /**
   * TootPanel用のonSendをoverrideする。
   * Send完了時にTootPanelを閉じたい
   * @return {Promise}
   */
  onSendReply(...args) {
    return this.props.onSendReply(this.props.status, ...args)
      .then(() => {
        this.showHidePanel(false, 'ReplyPanel')
      })
  }
}


function VisibilityIcon({visibility, className}) {
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
