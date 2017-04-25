import React from 'react'
import update from 'immutability-helper'
import PropTypes from 'prop-types'
import openpgp, {HKP, key as openpgpKey} from 'openpgp'


import {Account} from 'src/models'


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
      showContentsWarning: true,
      visibility: VISIBLITY_PUBLIC,
      isSending: false,
    }
    this.state.sendFrom.push(
      this.state.accountsState.tokensAndAccounts[0].account.address
    )

    require('assert')(this.state.accountsState.tokensAndAccounts.length > 0)

    // debug
    this.state = {
      ...this.state,
      mode: MODE_DIRECT,
      statusContent: 'テストだぴょん',
      messageTo: 'shn@oppai.tokyo',
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
    const {tokensAndAccounts} = accountsState

    const canSend = !isSending && this.state.sendFrom.length && statusContent.length

    // TODO: check valid messageTo

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

        {mode === MODE_DIRECT && (
          <div>
            <h2>To</h2>,
            <div className="toolWindow-messageTo">
              <input type="text" value={messageTo} onChange={::this.onChangeMessageTo} />
            </div>
          </div>
        )}

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
            <span>{statusContent.length}</span>
            <button disabled={!canSend} type="button"
              onClick={::this.onClickSend}>送信</button>
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
    this.setState({showContentsWarning: !this.state.showContentsWarning})
  }

  onToggleSendFrom(account) {
    // TODO: DMのときはRadio、TootのときはMulti Post
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

    const {
      accountsState,
      messageTo,
      statusContent,
      spoilerTextContent,
      showContentsWarning,
      mode,
      visibility,
      sendFrom,
    } = this.state
    const {tokensAndAccounts} = accountsState

    require('assert')(sendFrom.length > 0)

    // DMなので、宛先にPGP出来るか見る
    if(mode === MODE_DIRECT) {
      const response = await sendDirectMessage(
        tokensAndAccounts.find((ta) => ta.account.address === sendFrom[0]),
        messageTo,
        statusContent,
        showContentsWarning ? spoilerTextContent : null
      )
    }
  }
}

async function sendDirectMessage({token, account}, messageTo, status, spoilerText) {
  // 宛先ユーザの情報を得る
  const requester = token.requester
  let response = await requester.searchAccount({
    q: messageTo,
    resolve: true,
    limit: 1,
  })
  const {accounts} = response
  const target = accounts && accounts.length >= 1 && new Account(accounts[0])

  // 公開鍵をもっていたらメッセージを暗号化する
  if(target.hasPublicKey) {
    const hkp = new HKP('http://sks.oppai.tokyo')
    const key = await hkp.lookup({
      query: target.acct.indexOf('@') >= 0 ? target.acct : `${target.acct}@${target.host}`,
      keyId: target.publicKeyId,
    })

    const pubkey = key && openpgpKey.readArmored(key)

    if(pubkey) {
      [status, spoilerText] = await Promise.all([
        encryptText(pubkey, status),
        encryptText(pubkey, spoilerText),
      ])
    } else {
      console.log(`Failed to get ${target.acct}\'s public key (${target.publicKeyId})`)
    }
  }

  // send
  response = await requester.postStatus({
    status: `@${target.acct} ${status}`,
    spoiler_text: spoilerText,
    visibility: 'direct',
  })
  console.log(response)
}

/**
 */
async function encryptText(pubkey, text) {
  if(!text)
    return text

  const ciphertext = await openpgp.encrypt({
    data: text,
    publicKeys: pubkey.keys,
    armor: false,
    detached: true,
  })
  debugger
  return slimPGPMessage(ciphertext.data)
}


/**
 * see http://srgia.com/docs/rfc1991j.html#2.4.1
 */
function slimPGPMessage(pgpMessage) {
  pgpMessage = pgpMessage.trim()
  require('assert')(pgpMessage.startsWith(BLOCK_BEGIN_PGP_MESSAGE))
  require('assert')(pgpMessage.endsWith(BLOCK_END_PGP_MESSAGE))

  pgpMessage = pgpMessage.substring(
    BLOCK_BEGIN_PGP_MESSAGE.length,
    pgpMessage.length - BLOCK_END_PGP_MESSAGE.length)
  pgpMessage = pgpMessage.replace(/\r\n/g, '\n').split('\n\n')[1].replace(/\n/g, '').trim()
  return `<pgp>${pgpMessage}</pgp>`
}


function asyncSetState(component, state) {
  return new Promise((resolve, reject) => {
    component.setState(state, () => resolve())
  })
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
