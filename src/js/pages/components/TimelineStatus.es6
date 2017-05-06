import React from 'react'
import PropTypes from 'prop-types'

import {
  VISIBLITY_DIRECT, VISIBLITY_PRIVATE, VISIBLITY_UNLISTED, VISIBLITY_PUBLIC,
} from 'src/constants'
import {Status} from 'src/models'
import {DropdownMenuButton, IconFont, UserIconWithHost} from '../parts'
import TootPanel from './TootPanel'


export default class TimelineStatus extends React.Component {
  static propTypes = {
    status: PropTypes.instanceOf(Status).isRequired,
    ...TootPanel.propTypes,
  }

  /**
   * @constructor
   */
  constructor(...args) {
    super(...args)

    const {status} = this.props
    const mainStatus = status.reblog || status

    this.state = {
      isShowMediaCover: status.sensitive,
      isContentOpen: mainStatus.hasSpoilerText ? false : true,
      isShowReplyPanel: false,
      beginReplyPanelAnimation: true,
    }
  }

  /**
   * @override
   */
  render() {
    const {status} = this.props
    const {isContentOpen, isShowReplyPanel} = this.state
    const mainStatus = status.reblog || status
    const account = mainStatus.account
    const statusBodyClass = ['status-body']

    if(mainStatus.spoilerText.length) {
      statusBodyClass.push(
        'has-spoilerText',
        isContentOpen ? 'is-contentOpen' : 'is-contentClose'
      )
    }

    return (
      <article className="status timeline-status">

        {status.reblog && (
          <div className="status-row status-reblogFrom">
            <div className="status-rowLeft"><IconFont iconName="reblog" /></div>
            <div className="status-rowRight">
              {status.account.display_name} さんにブーストされました
            </div>
          </div>
        )}

        <div className="status-row status-content">
          <div className="status-rowLeft">
            <div className="status-avatar">
              <UserIconWithHost account={account} />
            </div>
            <div className="status-visibility">
              <VisibilityIcon visibility={status.visibility} />
            </div>
          </div>
          <div className="status-rowRight">

            <div className="status-info">
              <div className="status-author">
                <span className="user-displayName">{account.display_name || account.username}</span>
                <span className="user-account">@{account.account}</span>
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
                <div className="status-content" dangerouslySetInnerHTML={{__html: mainStatus.content}} />
              )}
            </div>

            {this.renderMedia()}

            <div className="status-actions">
              <button
                className={`status-actionReply ${isShowReplyPanel ? 'is-active' : ''}`}
                onClick={::this.onClickToggleReply}>
                <IconFont iconName="reply" />
              </button>

              {status.canReblog() ? (
                <button className="status-actionReblog">
                  <IconFont iconName="reblog" />
                </button>
              ) : (
                <VisibilityIcon visibility={status.visibility} />
              )}

              <button className="status-actionFavorite">
                <IconFont iconName="star-filled" />
              </button>

              <button className="status-actionMenu">
                <DropdownMenuButton onRenderMenu={::this.onRenderStatusMenu}>
                  <IconFont iconName="dot-3" />
                </DropdownMenuButton>
              </button>
            </div>

          </div>
        </div>

        {isShowReplyPanel && this.renderReplyPanel()}

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
    const {status} = this.props
    const {isShowMediaCover} = this.state
    const mainStatus = status.reblog || status
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

  renderReplyPanel() {
    const {beginReplyPanelAnimation} = this.state

    return (
      <div className={`status-replyPanel ${beginReplyPanelAnimation ? 'off' : ''}`}>
        <div>
          <TootPanel {...this.props}
            onSend={::this.onSendReply}
            />
        </div>
      </div>
    )
  }

  // callbacks
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
    this.showHideReplyPanel(!this.state.isShowReplyPanel)
  }

  showHideReplyPanel(show) {
    if(show) {
      this.setState(
        {isShowReplyPanel: true, beginReplyPanelAnimation: true},
        () => this.setState({beginReplyPanelAnimation: false})
      )
    } else {
      this.setState(
        {isShowReplyPanel: true, beginReplyPanelAnimation: true},
        () => setTimeout(() => this.setState({isShowReplyPanel: false}), 300)
      )
    }
  }


  /**
   * TootPanel用のonSendをoverrideする。
   * Send完了時にTootPanelを閉じたい
   */
  onSendReply(...args) {
    // TODO: 突然閉じるのでアニメーションしたい...
    return this.props.onSend(...args)
      .then(() => {
        this.showHideReplyPanel(false)
      })
  }
}


function VisibilityIcon({visibility}) {
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

  return <IconFont iconName={iconName} />
}
