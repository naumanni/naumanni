import React from 'react'
import update from 'immutability-helper'
import PropTypes from 'prop-types'

import {Account} from 'src/models'
import {IconFont, UserIconWithHost} from 'src/pages/parts'


const MODE_TOOT = 'toot'
const MODE_DIRECT = 'direct'

// const VISIBLITY_DIRECT = 'direct'
const VISIBLITY_PRIVATE = 'private'
const VISIBLITY_UNLISTED = 'unlisted'
const VISIBLITY_PUBLIC = 'public'

const BLOCK_BEGIN_PGP_MESSAGE = '-----BEGIN PGP MESSAGE-----'
const BLOCK_END_PGP_MESSAGE = '-----END PGP MESSAGE-----'


// TODO: support reply

/**
 * Status作成画面
 */
export default class TootWindow extends React.Component {
  static contextTypes = {
    context: PropTypes.any,
  }

  constructor(...args) {
    super(...args)

    this.state = {
      ...this.getStateFromContext(),
      statusContent: '',
      spoilerTextContent: '',
      messageTo: '',
      sendFrom: [],
      mode: MODE_TOOT,
      showContentsWarning: false,
      visibility: VISIBLITY_PUBLIC,
      isSending: false,
    }
    if(this.state.accountsState.tokens.length > 0) {
      this.state.sendFrom.push(
        this.state.accountsState.tokens[0].account.account
      )
    }

    // debug
    // this.state = {
    //   ...this.state,
    //   mode: MODE_DIRECT,
    //   statusContent: 'テストだぴょん',
    //   messageTo: 'shn@oppai.tokyo',
    // }
  }

  /**
   * @override
   */
  componentDidMount() {
    // update accounts
    const {context} = this.context

    this.listenerRemovers = [
      context.onChange(::this.onChangeConext),
    ]

    // focus
    this.refs.textareaStatus.focus()
  }

  /**
   * @override
   */
  componentWillUnmount() {
    for(const remover of this.listenerRemovers) {
      remover()
    }
  }

  /**
   * @override
   */
  render() {
    const {
      accountsState,
      messageTo,
      showContentsWarning,
      statusContent,
      spoilerTextContent,
      mode,
      visibility,
      isSending,
    } = this.state
    const {tokens} = accountsState

    const canSend = !isSending && this.state.sendFrom.length && statusContent.length

    // TODO: check valid messageTo

    return (
      <div className="tootWindow">
        <div className="tootWindow-close">
          <button onClick={this.props.onClose}><IconFont iconName="cancel" /></button>
        </div>

        <div className="tootWindow-tabs">
          <span
            className={`tootWindow-tab ${mode === MODE_TOOT && 'is-active'}`}
            onClick={this.onClickTab.bind(this, MODE_TOOT)}>
            <IconFont iconName="toot" /> トゥート</span>
          <span
            className={`tootWindow-tab ${mode === MODE_DIRECT && 'is-active'}`}
            onClick={this.onClickTab.bind(this, MODE_DIRECT)}>
            <IconFont iconName="mail" /> DM</span>
        </div>

        <div className="tootWindow-form">
          {mode === MODE_DIRECT && (
            <div>
              <h2>To</h2>
              <div className="toolWindow-messageTo">
                <input type="text" value={messageTo} onChange={::this.onChangeMessageTo} />
              </div>
            </div>
          )}

          <h2>From</h2>
          <ul className="tootWindow-sendFrom">
            {tokens.map((token) => {
              const {account} = token
              const isSelected = this.state.sendFrom.indexOf(account.address) >= 0

              return (
                <li className={isSelected && 'is-selected'}
                    key={account.address}
                    onClick={this.onToggleSendFrom.bind(this, account)}>
                  <UserIconWithHost account={account} />
                </li>
              )
            })}
          </ul>

          <h2>Toot</h2>
          <div className="tootWindow-content">
            {showContentsWarning && (
              <textarea
                ref="textareaSpoilerText"
                className="tootWindow-spoilerText"
                value={spoilerTextContent}
                placeholder="内容の警告"
                onChange={::this.onChangeSpoilerText}></textarea>
            )}

            <textarea
              ref="textareaStatus"
              className="tootWindow-status" value={statusContent}
              placeholder="何してますか？忙しいですか？手伝ってもらってもいいですか？"
              onChange={::this.onChangeStatus}></textarea>
          </div>

          {mode === MODE_TOOT && (
            <ul className="toolWindow-messageTo">
              <li
                className={visibility === VISIBLITY_PUBLIC ? 'is-active' : ''}
                onClick={this.onClickVisibility.bind(this, VISIBLITY_PUBLIC)}>
                <b><IconFont iconName="globe" /> 公開</b>
                <p>公開TLに投稿する</p>
              </li>

              <li
                className={visibility === VISIBLITY_UNLISTED ? 'is-active' : ''}
                onClick={this.onClickVisibility.bind(this, VISIBLITY_UNLISTED)}>
                <b><IconFont iconName="lock-open" /> 未収録</b>
                <p>公開TLでは表示しない</p>
              </li>

              <li
                className={visibility === VISIBLITY_PRIVATE ? 'is-active' : ''}
                onClick={this.onClickVisibility.bind(this, VISIBLITY_PRIVATE)}>
                <b><IconFont iconName="lock" /> 非公開</b>
                <p>フォロワーだけに公開</p>
              </li>
            </ul>
          )}

          <div className="tootWindow-actions">
            <button className="tootWindow-addMedia" type="button">
              <IconFont iconName="camera" />メディアを追加
            </button>
            <button className="tootWindow-toggleContentsWarning" type="button"
              onClick={::this.onClickToggleShowContentsWarning}>
              CW
            </button>

            <div className="tootWindow-send">
              <span className="tootWindow-charCount">{statusContent.length}</span>
              <button disabled={!canSend} type="button"
                onClick={::this.onClickSend}>送信</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  onChangeConext() {
    this.setState(this.getStateFromContext())
  }

  getStateFromContext() {
    const {accountsState} = this.context.context.getState()
    return {
      accountsState,
    }
  }

  onClickTab(mode) {
    const update = {mode}

    if(mode === MODE_DIRECT) {
      // DMの場合はFromは1人
      if(this.state.sendFrom.length)
        update.sendFrom = this.state.sendFrom[0]
    }

    this.setState(update)
  }

  onChangeMessageTo(e) {
    this.setState({messageTo: e.target.value})
  }

  onChangeSpoilerText(e) {
    this.setState({spoilerTextContent: e.target.value})
  }

  onChangeStatus(e) {
    this.setState({statusContent: e.target.value})
  }

  onClickVisibility(visibility) {
    this.setState({visibility})
  }

  onClickToggleShowContentsWarning() {
    this.setState({showContentsWarning: !this.state.showContentsWarning}, () => {
      if(this.state.showContentsWarning)
        this.refs.textareaSpoilerText.focus()
    })
  }

  onToggleSendFrom(account) {
    // DMのときはRadio、TootのときはMulti Post
    let {mode, sendFrom} = this.state
    if(mode === MODE_TOOT) {
      const idx = sendFrom.indexOf(account.address)

      if(idx >= 0) {
        sendFrom = update(sendFrom, {$splice: [[idx, 1]]})
      } else {
        sendFrom = update(sendFrom, {$push: [account.address]})
      }
    } else {
      sendFrom = [account.address]
    }

    this.setState({sendFrom})
  }

  async onClickSend() {
    require('assert')(!this.state.isSending)

    this.setState({isSending: true}, async () => {
      try {
        await this.sendMessageWithUI()

        // send succeeded event to parent
      } finally {
        this.setState({isSending: false})
      }
    })
  }

  async sendMessageWithUI() {
    require('assert')(this.state.isSending)

    let {
      statusContent,
      spoilerTextContent,
      showContentsWarning,
      mode,
      visibility,
      sendFrom,
    } = this.state
    const {tokens} = this.state.accountsState

    sendFrom = sendFrom.map((acct) => tokens.find((token) => token.acct === acct))
    require('assert')(sendFrom.length > 0)

    if(mode === MODE_DIRECT) {
      const {messageTo} = this.state
      require('assert')(sendFrom.length === 1)
      visibility = 'direct'

      let accounts = await sendFrom[0].requester.searchAccount({
        q: messageTo,
        limit: 1,
      })
      const target = accounts && accounts.length >= 1 && new Account(accounts[0])
      const targetAcct = target ? target.acct : messageTo

      statusContent = `@${targetAcct} ${statusContent}`
    }

    for(const sendFromToken of sendFrom) {
      const response = await sendFromToken.requester.postStatus({
        status: statusContent,
        spoiler_text: showContentsWarning ? spoilerTextContent : null,
        visibility,
      })
      console.log(sendFromToken.toString(), '->', response)
    }

    // close tootwindow
    this.props.onClose()
  }
}

