import React from 'react'
import PropTypes from 'prop-types'
import update from 'immutability-helper'
import {intlShape, FormattedMessage as _FM} from 'react-intl'
import {getTweetLength} from 'twitter-text'

import {
  MASTODON_MAX_CONTENT_SIZE,
  VISIBLITY_DIRECT, VISIBLITY_PRIVATE, VISIBLITY_UNLISTED, VISIBLITY_PUBLIC,
  KEY_ENTER, KEY_ESC,
} from 'src/constants'
import {OAuthTokenListPropType} from 'src/propTypes'
import TootProgress from 'src/utils/TootProgress'
import {IconFont, TootProgressBar, UserIconWithHost} from 'src/pages/parts'
import MediaFileThumbnail from 'src/pages/parts/MediaFileThumbnail'
import AutoSuggestTextarea from './AutoSuggestTextarea'


const MAX_MEDIA_FILES = 4

/**
 * Tootを編集する。ロジックは提供しないよ
 */
export default class TootForm extends React.Component {
  static contextTypes = {
    intl: intlShape,
  }

  static propTypes = {
    maxContentLength: PropTypes.number,
    tokens: OAuthTokenListPropType.isRequired,
    onSend: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    initialSendFrom: PropTypes.arrayOf(PropTypes.string),
    initialContent: PropTypes.string,
    initialVisibility: PropTypes.string,
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

    const {initialSendFrom, initialVisibility, tokens} = this.props

    this.state = {
      error: null,
      isSending: false,
      mediaFiles: [],
      messageTo: '',
      progress: 0,
      progressStatus: '',
      sendFrom: initialSendFrom != null ? initialSendFrom : [tokens.get(0).acct],
      showContentsWarning: false,
      spoilerTextContent: '',
      statusContent: this.props.initialContent || '',
      visibility: initialVisibility || VISIBLITY_PUBLIC,
      sensitive: false,
    }
    this.mediaFileKeys = new WeakMap()
    this.mediaFileCounter = 0
    this.listenerRemovers = []
  }

  /**
   * @override
   */
  componentWillUnmount() {
    this.listenerRemovers.forEach((remover) => remover())
  }

  /**
   * @override
   */
  render() {
    const {formatMessage: _} = this.context.intl
    const {maxContentLength, tokens} = this.props
    let {error} = this.state
    const {
      isSending, mediaFiles, progress, progressStatus,
      sendFrom, sensitive, showContentsWarning, spoilerTextContent, statusContent, visibility,
    } = this.state

    if(mediaFiles.length > MAX_MEDIA_FILES)
      error = _({id: 'toot_form.error.max_media_files'}, {mediaFileCount: MAX_MEDIA_FILES})

    return (
      <div className="tootForm">
        {error && (
          <div className="tootForm-error">
            {error}
          </div>
        )}

        <h2><_FM id="toot_form.head.from" /></h2>
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
        <p className="tootForm-note"><_FM id="toot_form.note.select_multiple_author" /></p>

        <h2><_FM id="toot_form.head.toot" /></h2>
        <div className="tootForm-content">
          {showContentsWarning && (
            <textarea
              ref="textareaSpoilerText"
              className="tootForm-spoilerText"
              value={spoilerTextContent}
              placeholder={_({id: 'toot_form.note.spoiler_text_form'})}
              onKeyDown={::this.onKeyDown}
              onChange={::this.onChangeSpoilerText}></textarea>
          )}

          <AutoSuggestTextarea
            statusContent={statusContent}
            tokens={this.sendFromTokens}
            onChangeStatus={::this.onChangeStatus}
            onKeyDown={::this.onKeyDown}
          />

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
            {mediaFiles.length > 0 &&
              <button
                className={`tootForm-toggleNsfw ${sensitive ? 'is-active' : ''}`}
                type="button"
                onClick={::this.onClickToggleNsfw}>
                <IconFont iconName="nsfw" />
              </button>
            }
          </div>
        </div>

        <ul className="tootForm-messageTo">
          <li
            className={visibility === VISIBLITY_PUBLIC ? 'is-active' : ''}
            onClick={this.onClickVisibility.bind(this, VISIBLITY_PUBLIC)}>
            <b><IconFont iconName="globe" /> <_FM id="toot_form.label.visiblity_public" /></b>
            <p><_FM id="toot_form.note.visiblity_public" /></p>
          </li>

          <li
            className={visibility === VISIBLITY_UNLISTED ? 'is-active' : ''}
            onClick={this.onClickVisibility.bind(this, VISIBLITY_UNLISTED)}>
            <b><IconFont iconName="lock-open" /> <_FM id="toot_form.label.visiblity_unlisted" /></b>
            <p><_FM id="toot_form.note.visiblity_unlisted" /></p>
          </li>

          <li
            className={visibility === VISIBLITY_PRIVATE ? 'is-active' : ''}
            onClick={this.onClickVisibility.bind(this, VISIBLITY_PRIVATE)}>
            <b><IconFont iconName="lock" /> <_FM id="toot_form.label.visiblity_private" /></b>
            <p><_FM id="toot_form.note.visiblity_private" /></p>
          </li>

          <li
            className={visibility === VISIBLITY_DIRECT ? 'is-active' : ''}
            onClick={this.onClickVisibility.bind(this, VISIBLITY_DIRECT)}>
            <b><IconFont iconName="mail" /> <_FM id="toot_form.label.visiblity_direct" /></b>
            <p><_FM id="toot_form.note.visiblity_direct" /></p>
          </li>
        </ul>

        <div className="tootForm-send">
          {isSending && <TootProgressBar progress={progress} statusText={progressStatus} />}
          <span className="tootForm-charCount">{maxContentLength - this.charactersCount}</span>
          <button
            className="button button--primary"
            disabled={!this.canSend()} type="button"
            onClick={::this.onClickSend}><_FM id="toot_form.label.send" /></button>
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
      <div className="tootForm-mediaFiles">
        {mediaFiles.map((file) => {
          return <MediaFileThumbnail
            key={this.mediaFileKeys.get(file)} mediaFile={file} showClose={true}
            onClose={this.onRemoveMediaFile.bind(this, file)} />
        })}
      </div>
    )
  }

  get sendFromTokens() {
    return this.props.tokens.filter(
      (token) => this.state.sendFrom.find((acct) => acct === token.acct)
    )
  }

  get charactersCount() {
    const {showContentsWarning, statusContent, spoilerTextContent} = this.state

    return getTweetLength(statusContent) +
      (showContentsWarning ? getTweetLength(spoilerTextContent) : 0)
  }

  canSend() {
    const {maxContentLength} = this.props
    const {isSending, sendFrom, statusContent} = this.state

    const trimmedStatusLength = statusContent.trim().length

    return !isSending && sendFrom.length &&
      trimmedStatusLength > 0 && this.charactersCount < maxContentLength &&
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

  onChangeStatus(statusContent) {
    this.setState({statusContent})
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
    if(idx >= 0) {
      const newState = update(this.state, {mediaFiles: {$splice: [[idx, 1]]}})
      this.setState({
        ...newState,
        sensitive: newState.mediaFiles.length === 0 ? false : newState.sensitive,
      })
    }
  }

  onClickToggleShowContentsWarning() {
    this.setState({showContentsWarning: !this.state.showContentsWarning}, () => {
      if(this.state.showContentsWarning)
        this.refs.textareaSpoilerText.focus()
    })
  }

  onClickToggleNsfw() {
    this.setState({
      sensitive: !this.state.sensitive,
    })
  }

  onClickSend(e) {
    e.preventDefault()

    const {
      mediaFiles, statusContent, showContentsWarning, spoilerTextContent, visibility, sensitive,
    } = this.state
    const message = {
      status: statusContent.trim(),
      spoiler_text: showContentsWarning ? spoilerTextContent.trim() : null,
      visibility,
      sensitive,
    }
    const messageContent = {
      mediaFiles,
      message,
    }
    this.tootProgress = new TootProgress(this.context, this.sendFromTokens, mediaFiles)
    this.listenerRemovers.push(this.tootProgress.onChange(::this.onChangeProgress))

    this.setState({isSending: true, error: null}, () => {
      this.props.onSend(
        this.sendFromTokens,
        messageContent,
        this.tootProgress,
      )
        .then(() => {
          // 送信成功したら閉じる
          this.setState({isSending: false})
          this.tootProgress.clean()
          this.props.onClose()
        }, (error) => {
          this.setState({isSending: false, error: '' + error})
        })
    })
  }

  onChangeProgress() {
    const {progress, status: progressStatus} = this.tootProgress

    this.setState({
      progress,
      progressStatus,
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
