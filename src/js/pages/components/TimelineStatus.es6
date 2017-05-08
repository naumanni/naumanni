import React from 'react'
import PropTypes from 'prop-types'


import {
  VISIBLITY_DIRECT, VISIBLITY_PRIVATE, VISIBLITY_UNLISTED, VISIBLITY_PUBLIC,
} from 'src/constants'
import {DropdownMenuButton, IconFont, UserIconWithHost} from '../parts'
import TootPanel from './TootPanel'
import {AccountPropType, StatusPropType} from 'src/propTypes'


export default class TimelineStatus extends React.Component {
  static propTypes = {
    account: AccountPropType.isRequired,
    status: StatusPropType.isRequired,
    reblog: StatusPropType,
    reblogAccount: AccountPropType.isRequired,
    tokens: TootPanel.propTypes.tokens,
    // Reply送信ボタンが押された
    onSendReply: TootPanel.propTypes.onSend,
    // Fav/UnfavがClickされた
    onFavouriteStatus: PropTypes.func.isRequired,
    // Reblog/UnreblogがClickされた
    onReblogStatus: PropTypes.func.isRequired,
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
      beginReplyPanelAnimation: true,
    }
  }

  /**
   * @override
   */
  render() {
    const {status, reblog, account, reblogAccount} = this.props
    require('assert')(!reblog || (reblog && reblogAccount))
    const {isContentOpen, isShowReplyPanel} = this.state
    const mainStatus = reblog || status
    const mainAccount = reblogAccount || account
    const statusBodyClass = ['status-body']
    // このstatusに対応可能なtoken
    const tokens = this.props.tokens.filter((token) => status.hosts.indexOf(token.host) >= 0)

    if(mainStatus.spoilerText.length) {
      statusBodyClass.push(
        'has-spoilerText',
        isContentOpen ? 'is-contentOpen' : 'is-contentClose'
      )
    }

    // reblog, favの状況, tokenが1つであればそのまま
    const isReblogged = tokens.find((token) => status.isRebloggedAt(token.acct)) ? true : false
    const isFavourited = tokens.find((token) => status.isFavouritedAt(token.acct)) ? true : false

    return (
      <article className="status timeline-status">

        {reblog && (
          <div className="status-row status-reblogFrom">
            <div className="status-rowLeft"><IconFont iconName="reblog" /></div>
            <div className="status-rowRight">
              {account.display_name} さんにブーストされました
            </div>
          </div>
        )}

        <div className="status-row status-content">
          <div className="status-rowLeft">
            <div className="status-avatar">
              <UserIconWithHost account={mainAccount} />
            </div>
            <div className="status-visibility">
              <VisibilityIcon visibility={status.visibility} />
            </div>
          </div>
          <div className="status-rowRight">

            <div className="status-info">
              <div className="status-author">
                <span className="user-displayName">{mainAccount.display_name || mainAccount.username}</span>
                <span className="user-account">@{mainAccount.acct}</span>
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
                <button className="status-actionReblog"
                  onClick={::this.onClickToggleReblog}>
                  <IconFont iconName="reblog" className={isReblogged ? 'is-active' : ''} />
                </button>
              ) : (
                <VisibilityIcon visibility={status.visibility} className="is-inactive" />
              )}

              <button
                className="status-actionFavorite"
                onClick={::this.onClickToggleFavourite}>
                <IconFont iconName="star-filled" className={isFavourited ? 'is-active' : ''} />
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
    const {status, account, tokens} = this.props
    console.log(status.resolve().toJSON())
    const {beginReplyPanelAnimation} = this.state

    // デフォルトの返信元。 Statusと同じホストの最初のアカウントから選ぶ
    let sendFrom = tokens.filter((t) => t.host === account.instance).map((a) => a.acct)

    return (
      <div className={`status-replyPanel ${beginReplyPanelAnimation ? 'off' : ''}`}>
        <div>
          <TootPanel {...this.props}
            onSend={::this.onSendReply}
            initialSendFrom={sendFrom}
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

  onClickToggleReblog(e) {
    e.preventDefault()

    const {status} = this.props
    const tokens = this.props.tokens.filter((token) => status.hosts.indexOf(token.host) >= 0)

    if(tokens.length === 1) {
      this.props.onReblogStatus(tokens[0], status, !status.isRebloggedAt(tokens[0].acct))
    } else {
      require('assert')(0, 'not implemented')
    }
  }
  onClickToggleFavourite(e) {
    e.preventDefault()

    const {status} = this.props
    const tokens = this.props.tokens.filter((token) => status.hosts.indexOf(token.host) >= 0)

    if(tokens.length === 1) {
      this.props.onFavouriteStatus(tokens[0], status, !status.isFavouritedAt(tokens[0].acct))
    } else {
      require('assert')(0, 'not implemented')
    }
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
   * @return {Promise}
   */
  onSendReply(...args) {
    // TODO: 突然閉じるのでアニメーションしたい...
    return this.props.onSendReply(...args)
      .then(() => {
        this.showHideReplyPanel(false)
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
