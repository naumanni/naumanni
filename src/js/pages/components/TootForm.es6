import React from 'react'
import PropTypes from 'prop-types'
import update from 'immutability-helper'
import Textarea from 'react-textarea-autosize'

import {
  MASTODON_MAX_CONTENT_SIZE,
  VISIBLITY_DIRECT, VISIBLITY_PRIVATE, VISIBLITY_UNLISTED, VISIBLITY_PUBLIC,
  KEY_ENTER, KEY_ESC, TOOTFORM_PLACEHOLDER,
} from 'src/constants'
import {OAuthTokenListPropType} from 'src/propTypes'
import {IconFont, UserIconWithHost} from 'src/pages/parts'
import MediaFileThumbnail from 'src/pages/parts/MediaFileThumbnail'


const MAX_MEDIA_FILES = 4

/**
 * Tootを編集する。ロジックは提供しないよ
 */
export default class TootForm extends React.Component {
  static propTypes = {
    maxContentLength: PropTypes.number,
    tokens: OAuthTokenListPropType.isRequired,
    onSend: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    initialSendFrom: PropTypes.arrayOf(PropTypes.string),
    initialContent: PropTypes.string,
  }

  static defaultProps = {
    maxContentLength: MASTODON_MAX_CONTENT_SIZE,
    initialSendFrom: null,
    initialContent: '',
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
      sendFrom: initialSendFrom != null ? initialSendFrom : [tokens.get(0).acct],
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
    const {tokens} = this.props
    let {error} = this.state
    const {showContentsWarning, sendFrom, statusContent, spoilerTextContent, visibility} = this.state

    const trimmedStatusLength = statusContent.trim().length
    const textLength = trimmedStatusLength + (showContentsWarning ? spoilerTextContent.trim().length : 0)

    if(this.state.mediaFiles.length > MAX_MEDIA_FILES)
      error = `添付できるメディアは${MAX_MEDIA_FILES}つまでです`

    return (
      <div className="tootForm">
        {error && (
          <div className="tootForm-error">
            {error}
          </div>
        )}

        <h2>From</h2>
        <ul className="tootForm-sendFrom">
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
        <p className="tootForm-note">Shift+Clickで複数選択できます。</p>

        <h2>Toot</h2>
        <div className="tootForm-content">
          {showContentsWarning && (
            <textarea
              ref="textareaSpoilerText"
              className="tootForm-spoilerText"
              value={spoilerTextContent}
              placeholder="内容の警告"
              onKeyDown={::this.onKeyDown}
              onChange={::this.onChangeSpoilerText}></textarea>
          )}

          <Textarea
            ref="textareaStatus"
            className="tootForm-status" value={statusContent}
            placeholder={TOOTFORM_PLACEHOLDER}
            onKeyDown={::this.onKeyDown}
            onChange={::this.onChangeStatus}
            minRows={3}
            maxRows={TootForm.maxTootRows()}></Textarea>

          {this.renderMediaFiles()}

          <div className="tootForm-contentActions">
            <label className="tootForm-addMedia">
              <IconFont iconName="camera" />
              <input
                type="file"
                multiple="multiple"
                style={{display: 'none'}} ref="fileInput" onChange={::this.onChangeMediaFile} />
            </label>
            <button
              className={`tootForm-toggleContentsWarning ${showContentsWarning ? 'is-active' : ''}`}
              type="button"
              onClick={::this.onClickToggleShowContentsWarning}>
              <IconFont iconName="attention" />
            </button>
          </div>
        </div>

        <ul className="tootForm-messageTo">
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

        <div className="tootForm-send">
          <span className="tootForm-charCount">{500 - textLength}</span>
          <button
            className="button button--primary"
            disabled={!this.canSend()} type="button"
            onClick={::this.onClickSend}>送信</button>
        </div>
      </div>
    )
  }

  static maxTootRows() {
    const staticHeightExceptTootTextArea = 400  // really rongh estimate...
    const lineHeight = 20
    return Math.floor((document.body.clientHeight - staticHeightExceptTootTextArea) / lineHeight)
  }

  renderMediaFiles() {
    const {mediaFiles} = this.state

    if(!mediaFiles) {
      return null
    }

    return (
      <div className="tootForm-mediaFiles">
        {mediaFiles.map((file) => {
          return <MediaFileThumbnail
            key={this.mediaFileKeys.get(file)} mediaFile={file} showClose={true}
            onClose={this.onRemoveMediaFile.bind(this, file)} />
        })}
      </div>
    )
  }

  canSend() {
    const {maxContentLength} = this.props
    const {isSending, showContentsWarning, sendFrom, statusContent, spoilerTextContent} = this.state

    const trimmedStatusLength = statusContent.trim().length
    const textLength = trimmedStatusLength + (showContentsWarning ? spoilerTextContent.trim().length : 0)

    return !isSending && sendFrom.length &&
      trimmedStatusLength > 0 && textLength < maxContentLength &&
      this.state.mediaFiles.length <= MAX_MEDIA_FILES
  }


  /**
   * ユーザーが閉じようとした時に呼ばれる。
   * 空だったら閉じる、からじゃなかったら今のところスルー（本当は確認出したい）
   */
  wantClose() {
    const {mediaFiles, statusContent, spoilerTextContent} = this.state

    if(mediaFiles.length || spoilerTextContent.length || (this.props.initialContent != statusContent)) {
      // 空じゃないので何もしない
      return
    }

    this.props.onClose()
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
          // 送信成功したら閉じる
          this.setState({isSending: false})
          this.props.onClose()
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

  /**
   * CW, ContentのKeydownで呼ばれる
   * Ctrl+Returnで送信する
   * @param {Event} e
   */
  onKeyDown(e) {
    if((e.ctrlKey || e.metaKey) && e.keyCode == KEY_ENTER && this.canSend()) {
      // (Ctrl|Cmd)+Enterで投稿したい
      this.onClickSend(e)
    } else if(e.keyCode == KEY_ESC) {
      // ESCが押されたら閉じたい
      this.wantClose()
    }
  }
}
