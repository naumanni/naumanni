import React from 'react'
import update from 'immutability-helper'
import PropTypes from 'prop-types'


import {Account} from 'src/models'


const MODE_TOOT = 'toot'
const MODE_DIRECT = 'direct'

// const VISIBLITY_DIRECT = 'direct'
const VISIBLITY_PRIVATE = 'private'
const VISIBLITY_UNLISTED = 'unlisted'
const VISIBLITY_PUBLIC = 'public'


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
      sendFrom: [],
      mode: MODE_TOOT,
      showContentsWarning: true,
      visibility: VISIBLITY_PUBLIC,
    }
    this.state.sendFrom.push(
      this.state.accountsState.tokensAndAccounts[0].account.address
    )

    require('assert')(this.state.accountsState.tokensAndAccounts.length > 0)
  }

  /**
   * @override
   */
  render() {
    const {
      accountsState,
      showContentsWarning,
      statusContent,
      spoilerTextContent,
      mode,
      visibility,
    } = this.state
    const {tokensAndAccounts} = accountsState

    const canSend = this.state.sendFrom.length && statusContent.length

    return (
      <div className="tootWindow">
        <div className="tabs">
          <span
            className={`tab ${mode === MODE_TOOT && 'is-active'}`}
            onClick={this.onClickTab.bind(this, MODE_TOOT)}>
            <IconFont iconName="toot" /> トゥート</span>
          <span
            className={`tab ${mode === MODE_DIRECT && 'is-active'}`}
            onClick={this.onClickTab.bind(this, MODE_DIRECT)}>
            <IconFont iconName="mail" /> DM</span>
        </div>

        {mode === MODE_DIRECT && [
          <h2>To</h2>,
          <div className="toolWindow-messageTo">
            <input type="text" />
          </div>,
        ]}

        <h2>From</h2>
        <ul className="tootWindow-sendFrom">
          {tokensAndAccounts.map((ta) => {
            const {account} = ta
            const isSelected = this.state.sendFrom.indexOf(account.address) >= 0

            return (
              <li className={isSelected && 'is-selected'}
                  key={ta.account.address}
                  onClick={this.onToggleSendFrom.bind(this, ta.account)}>
                <UserIconWithHost account={ta.account} />
              </li>
            )
          })}
        </ul>

        <h2>Toot</h2>
        <div className="tootWindow-form">
          {showContentsWarning && (
            <textarea
              className="tootWindow-spoilerText"
              value={spoilerTextContent}
              placeholder="内容の警告"
              onChange={::this.onChangeSpoilerText}></textarea>
          )}

          <textarea
            className="tootWindow-status" value={statusContent}
            placeholder="何してますか？忙しいですか？手伝ってもらってもいいですか？"
            onChange={::this.onChangeStatus}></textarea>
        </div>

        {mode === MODE_TOOT && (
          <ul className="toolWindow-messageTo">
            <li
              className={visibility === VISIBLITY_PUBLIC ? 'is-active' : ''}
              onClick={this.onClickVisibility.bind(this, VISIBLITY_PUBLIC)}>
              <span><IconFont iconName="globe" /></span>
              <p>
                <b>公開</b><br />
                公開TLに投稿する
              </p>
            </li>

            <li
              className={visibility === VISIBLITY_UNLISTED ? 'is-active' : ''}
              onClick={this.onClickVisibility.bind(this, VISIBLITY_UNLISTED)}>
              <span><IconFont iconName="lock-open" /></span>
              <p>
                <b>未収録</b><br />
                公開TLでは表示しない
              </p>
            </li>

            <li
              className={visibility === VISIBLITY_PRIVATE ? 'is-active' : ''}
              onClick={this.onClickVisibility.bind(this, VISIBLITY_PRIVATE)}>
              <span><IconFont iconName="lock" /></span>
              <p>
                <b>非公開</b><br />
                フォロワーだけに公開
              </p>
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
            <button disabled={!canSend} type="button">送信</button>
          </div>
        </div>
      </div>
    )
  }

  getStateFromContext() {
    const {accountsState} = this.context.context.getState()
    return {
      accountsState,
    }
  }

  onClickTab(mode) {
    this.setState({mode})
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
    this.setState({showContentsWarning: !this.state.showContentsWarning})
  }

  onToggleSendFrom(account) {
    console.log('onToggleSendFrom', account)
    let {sendFrom} = this.state
    const idx = sendFrom.indexOf(account.address)

    if(idx >= 0) {
      sendFrom = update(sendFrom, {$splice: [[idx, 1]]})
    } else {
      sendFrom = update(sendFrom, {$push: [account.address]})
    }
    this.setState({sendFrom})
  }
}

// 細かいやつ あとで移す
const AccountPropType = PropTypes.instanceOf(Account)

/**
 * ユーザーの顔アイコン with ホスト
 */
class UserIconWithHost extends React.Component {
  static propTypes = {
    account: AccountPropType.isRequired,
  }

  /**
   * @override
   */
  render() {
    const {account} = this.props

    return (
      <span className="userIcon with-host">
        <img className="userIcon-avatar" src={account.avatar} alt={account.address} title={account.address} />
        <img className="userIcon-host" src={`https://${account.host}/favicon.ico`} />
      </span>
    )
  }
}


/**
 * アイコンフォント
 */
class IconFont extends React.Component {
  static propTypes = {
    iconName: PropTypes.string.isRequired,
  }

  /**
   * @override
   */
  render() {
    return <span className={`icon-${this.props.iconName}`} />
  }
}
