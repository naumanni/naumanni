import React from 'react'
import PropTypes from 'prop-types'
import update from 'immutability-helper'

import {
  MASTODON_MAX_CONTENT_SIZE,
  VISIBLITY_DIRECT, VISIBLITY_PRIVATE, VISIBLITY_UNLISTED, VISIBLITY_PUBLIC,
} from 'src/constants'
import {OAuthTokenArrayPropType} from 'src/propTypes'
import {IconFont, UserIconWithHost} from 'src/pages/parts'
import MediaFileThumbnail from 'src/pages/parts/MediaFileThumbnail'


const MAX_MEDIA_FILES = 4

/**
 * Tootを編集する。ロジックは提供しないよ
 */
export default class TootPanel extends React.Component {
  static propTypes = {
    maxContentLength: PropTypes.number,
    tokens: OAuthTokenArrayPropType.isRequired,
    onSend: PropTypes.func.isRequired,
    initialSendFrom: PropTypes.arrayOf(PropTypes.string),
    initialContent: PropTypes.string,
  }

  static defaultProps = {
    maxContentLength: MASTODON_MAX_CONTENT_SIZE,
    initialSendFrom: null,
  }

  /**
   * @constructor
   */
  constructor(...args) {
    super(...args)

    const {initialSendFrom, tokens} = this.props

    this.state = {
      error: null,
      isSending: false,
      mediaFiles: [],
      messageTo: '',
      sendFrom: initialSendFrom != null ? initialSendFrom : [tokens[0].acct],
      showContentsWarning: false,
      spoilerTextContent: '',
      statusContent: this.props.initialContent || '',
      visibility: VISIBLITY_PUBLIC,
    }
    this.mediaFileKeys = new WeakMap()
    this.mediaFileCounter = 0
  }

  /**
   * @override
   */
  componentDidMount() {
    // focus
    this.refs.textareaStatus.focus()
  }

  /**
   * @override
   */
  render() {
    const {maxContentLength, tokens} = this.props
    let {error} = this.state
    const {isSending, showContentsWarning, sendFrom, statusContent, spoilerTextContent, visibility} = this.state

    const trimmedStatusLength = statusContent.trim().length
    const textLength = trimmedStatusLength + (showContentsWarning ? spoilerTextContent.trim().length : 0)
    const canSend = !isSending && sendFrom.length &&
      trimmedStatusLength > 0 && textLength < maxContentLength &&
      this.state.mediaFiles.length <= MAX_MEDIA_FILES

    if(this.state.mediaFiles.length > MAX_MEDIA_FILES)
      error = `添付できるメディアは${MAX_MEDIA_FILES}つまでです`

    return (
      <div className="tootPanel">
        {error && (
          <div className="tootPanel-error">
            {error}
          </div>
        )}

        <h2>From</h2>
        <ul className="tootPanel-sendFrom">
          {tokens.map((token) => {
            const {account} = token
            const isSelected = sendFrom.indexOf(account.acct) >= 0

            return (
              <li className={isSelected && 'is-selected'}
                  key={account.acct}
                  onClick={this.onToggleSendFrom.bind(this, account)}>
                <UserIconWithHost account={account} size="small" />
              </li>
            )
          })}
        </ul>
        <p className="tootPanel-note">Shift+Clickで複数選択できます。</p>

        <h2>Toot</h2>
        <div className="tootPanel-content">
          {showContentsWarning && (
            <textarea
              ref="textareaSpoilerText"
              className="tootPanel-spoilerText"
              value={spoilerTextContent}
              placeholder="内容の警告"
              onChange={::this.onChangeSpoilerText}></textarea>
          )}

          <textarea
            ref="textareaStatus"
            className="tootPanel-status" value={statusContent}
            placeholder="何してますか？忙しいですか？手伝ってもらってもいいですか？"
            onChange={::this.onChangeStatus}></textarea>

          {this.renderMediaFiles()}

          <div className="tootPanel-contentActions">
            <label className="tootPanel-addMedia">
              <IconFont iconName="camera" />
              <input
                type="file"
                multiple="multiple"
                style={{display: 'none'}} ref="fileInput" onChange={::this.onChangeMediaFile} />
            </label>
            <button
              className={`tootPanel-toggleContentsWarning ${showContentsWarning ? 'is-active' : ''}`}
              type="button"
              onClick={::this.onClickToggleShowContentsWarning}>
              <IconFont iconName="attention" />
            </button>
          </div>
        </div>

        <ul className="tootPanel-messageTo">
          <li
            className={visibility === VISIBLITY_PUBLIC ? 'is-active' : ''}
            onClick={this.onClickVisibility.bind(this, VISIBLITY_PUBLIC)}>
            <b><IconFont iconName="globe" /> 公開</b>
            <p>公開TLに投稿する</p>
          </li>

          <li
            className={visibility === VISIBLITY_UNLISTED ? 'is-active' : ''}
            onClick={this.onClickVisibility.bind(this, VISIBLITY_UNLISTED)}>
            <b><IconFont iconName="lock-open" /> 非収録</b>
            <p>公開TLでは表示しない</p>
          </li>

          <li
            className={visibility === VISIBLITY_PRIVATE ? 'is-active' : ''}
            onClick={this.onClickVisibility.bind(this, VISIBLITY_PRIVATE)}>
            <b><IconFont iconName="lock" /> 非公開</b>
            <p>フォロワーだけに公開</p>
          </li>

          <li
            className={visibility === VISIBLITY_DIRECT ? 'is-active' : ''}
            onClick={this.onClickVisibility.bind(this, VISIBLITY_DIRECT)}>
            <b><IconFont iconName="mail" /> DM</b>
            <p>メンションしたユーザーだけに公開</p>
          </li>
        </ul>

        <div className="tootPanel-send">
          <span className="tootPanel-charCount">{500 - textLength}</span>
          <button
            className="button button--primary"
            disabled={!canSend} type="button"
            onClick={::this.onClickSend}>送信</button>
        </div>
      </div>
    )
  }

  renderMediaFiles() {
    const {mediaFiles} = this.state

    if(!mediaFiles) {
      return null
    }

    return (
      <div className="tootPanel-mediaFiles">
        {mediaFiles.map((file) => {
          return <MediaFileThumbnail
            key={this.mediaFileKeys.get(file)} mediaFile={file} showClose={true}
            onClose={this.onRemoveMediaFile.bind(this, file)} />
        })}
      </div>
    )
  }

  // cb
  onChangeSpoilerText(e) {
    this.setState({spoilerTextContent: e.target.value})
  }

  onChangeStatus(e) {
    this.setState({statusContent: e.target.value})
  }

  onClickVisibility(visibility) {
    this.setState({visibility})
  }

  onChangeMediaFile(e) {
    let files = Array.from(e.target.files)

    for(const file of files) {
      this.mediaFileKeys.set(file, ++this.mediaFileCounter)
    }

    this.setState(update(this.state, {mediaFiles: {$push: files}}))
    e.target.value = null
  }

  onRemoveMediaFile(file) {
    const idx = this.state.mediaFiles.indexOf(file)
    if(idx >= 0)
      this.setState(update(this.state, {mediaFiles: {$splice: [[idx, 1]]}}))
  }

  onClickToggleShowContentsWarning() {
    this.setState({showContentsWarning: !this.state.showContentsWarning}, () => {
      if(this.state.showContentsWarning)
        this.refs.textareaSpoilerText.focus()
    })
  }

  onClickSend(e) {
    e.preventDefault()

    const {
      sendFrom, statusContent, showContentsWarning, spoilerTextContent, visibility,
    } = this.state
    const sendFromTokens = this.props.tokens.filter(
      (token) => sendFrom.find((acct) => acct === token.acct)
    )
    const message = {
      status: statusContent.trim(),
      spoiler_text: showContentsWarning ? spoilerTextContent.trim() : null,
      visibility,
    }

    this.setState({isSending: true, error: null}, () => {
      this.props.onSend(sendFromTokens, {
        mediaFiles: this.state.mediaFiles,
        message,
      })
        .then(() => {
          // TODO: 送信成功した時点で、閉じられちゃうからここで怒られる...
          this.setState({isSending: false})
        }, (error) => {
          this.setState({isSending: false, error: '' + error})
        })
    })
  }

  /**
   * Fromのアカウント選択
   * Shift+Keyを押せば複数選択できる
   * @param {Account} account
   * @param {MouseEvent} e
   */
  onToggleSendFrom(account, e) {
    let {sendFrom} = this.state

    if(e.shiftKey) {
      sendFrom = [...sendFrom]
      const idx = sendFrom.indexOf(account.acct)

      if(idx >= 0) {
        sendFrom.splice(idx, 1)
      } else {
        sendFrom.push(account.acct)
      }
    } else {
      sendFrom = [account.acct]
    }

    this.setState({sendFrom})
  }
}
