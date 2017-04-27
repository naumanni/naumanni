import React from 'react'
import PropTypes from 'prop-types'

import {
  VISIBLITY_DIRECT, VISIBLITY_PRIVATE, VISIBLITY_UNLISTED, VISIBLITY_PUBLIC,
} from 'src/constants'
import {UITimelineEntry} from 'src/models'
import {DropdownMenuButton, IconFont, UserIconWithHost} from '../parts'


export default class TimelineStatus extends React.Component {
  static propTypes = {
    entry: PropTypes.instanceOf(UITimelineEntry).isRequired,
    onToggleContentOpen: PropTypes.func.isRequired,
  }

  /**
   * @constructor
   */
  constructor(...args) {
    super(...args)

    const {entry} = this.props
    const status = entry.mainStatus

    this.state = {
      isShowMediaCover: status.sensitive,
    }
  }

  /**
   * @override
   */
  render() {
    const {entry} = this.props
    const status = entry.mainStatus
    const account = status.account

    const statusBodyClass = ['status-body']

    if(entry.hasSpoilerText) {
      statusBodyClass.push(
        'has-spoilerText',
        entry.canShowContent() ? 'is-contentOpen' : 'is-contentClose'
      )
    }

    return (
      <article className="status timeline-status">

        {entry.isReblogged() && (
          <div className="status-row status-reblogFrom">
            <div className="status-rowLeft"><IconFont iconName="reblog" /></div>
            <div className="status-rowRight">
              {entry.rebloggedUser.display_name} さんにブーストされました
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
                 href={status.url}
                 target="_blank"
                 alt={status.created_at}>{status.createdAt.fromNow()}
              </a>
            </div>

            <div className={statusBodyClass.join(' ')}>
              {entry.isDecrypted() &&
                <div className="status-isDecrypted"><span className="icon-lock" /> このメッセージは暗号化されています</div>}
              {entry.hasSpoilerText && this.renderSpoilerText()}
              {entry.canShowContent() && (
                <div className="status-content" dangerouslySetInnerHTML={{__html: entry.content}} />
              )}
            </div>

            {this.renderMedia()}

            <div className="status-actions">
              <button className="status-actionReply">
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
                <DropdownMenuButton onRenderMenu={this.onRenderStatusMenu.bind(this, entry)}>
                  <IconFont iconName="dot-3" />
                </DropdownMenuButton>
              </button>
            </div>

          </div>
        </div>

      </article>
    )
  }

  renderSpoilerText() {
    const {entry} = this.props

    if(!entry.hasSpoilerText)
      return null

    return (
      <div className="status-spoilerText">
        {entry.spoilerText}
        <a className="status-contentOpener"
          onClick={() => this.props.onToggleContentOpen(this.props.entry)}>
          {entry.isContentOpen ? '閉じる' : 'もっと見る...'}
        </a>
      </div>
    )
  }

  renderMedia() {
    const {entry} = this.props
    const {isShowMediaCover} = this.state
    const status = entry.mainStatus
    const mediaList = status.media_attachments
    if(!mediaList.length)
      return null

    const className = [
      'status-mediaList',
      `status-mediaList${mediaList.length}`,
    ]
    if(status.sensitive) {
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

  // callbacks
  onRenderStatusMenu(entry) {
    return (
      <div>hogehoge</div>
    )
  }

  onClickMediaCover() {
    this.setState({isShowMediaCover: !this.state.isShowMediaCover})
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
