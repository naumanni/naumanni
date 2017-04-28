import React from 'react'
import PropTypes from 'prop-types'
import {Link} from 'react-router-dom'

import {makeAPIRequester} from 'src/api/APIRequester'
import MastodonAPISpec from 'src/api/MastodonAPISpec'
import OAuthApp from 'src/models/OAuthApp'
import Database from 'src/infra/Database'
import GenerateKeypairUseCase from 'src/usecases/GenerateKeypairUseCase'

import TootWindow from './components/TootWindow'

const ACCOUNT_REX = /^@([^@]+)@(.*)$/


export default class AccountsPage extends React.Component {
  static contextTypes = {
    context: PropTypes.any,
  }

  constructor(...args) {
    super(...args)

    this.state = this.getStateFromContext()
  }

  /**
   * @override
   */
  componentDidMount() {
    // update accounts
    const {context} = this.context

    this.listenerRemovers = [
      context.onChange(() => this.setState(this.getStateFromContext())),
    ]
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
    const {accountsState} = this.state
    const {tokensAndAccounts} = accountsState

    return (
      <div className="page page-accounts">

        <ul className="mastodonAccounts">
          {tokensAndAccounts.map((ta) => this.renderTokenAndAccount(ta))}
          <li className="mastodonAccounts-addForm">
            <AddMastodonAccountWizard />
          </li>
        </ul>

        <div>
          <span style={{margin: '0 1em'}}>
            <Link to="/compound/home">統合ホーム</Link>
          </span>
          <span style={{margin: '0 1em'}}>
            <Link to="/compound/local">統合ローカル</Link>
          </span>
          <span style={{margin: '0 1em'}}>
            <Link to="/compound/federation">統合連合</Link>
          </span>
        </div>

        <TootWindow />

      </div>
    )
  }

  getStateFromContext() {
    const {accountsState} = this.context.context.getState()
    return {
      accountsState,
    }
  }

  renderTokenAndAccount({token, account}) {
    if(!account) {
      return (
        <li key={token.address}>
          {token.address}
        </li>
      )
    }
    return (
      <li key={token.address}>
        {account.display_name} / {account.host}<br />

        <div>
          <span style={{margin: '0 1em'}}>
            <Link to={`/account/${account.address}/home`}>ホーム</Link>
          </span>
          <span style={{margin: '0 1em'}}>
            <Link to={`/account/${account.address}/local`}>ローカルタイムライン</Link>
          </span>
          <span style={{margin: '0 1em'}}>
            <Link to={`/account/${account.address}/federation`}>連合タイムライン</Link>
          </span>
        </div>

        <div>
          {account.hasPublicKey ? (
            <span>
              🔑あり
              <button onClick={this.onClickGenerateKeypair.bind(this, token, account)}>鍵ペア再生成</button>
            </span>
          ) : (
            <span>
              🔑なし
              <button onClick={this.onClickGenerateKeypair.bind(this, token, account)}>鍵ペア生成</button>
            </span>
          )}

        </div>
      </li>
    )
  }

  onClickGenerateKeypair(token, account) {
    const {context} = this.context

    context.useCase(
      new GenerateKeypairUseCase()
    ).execute(token, account)
  }
}


class AddMastodonAccountWizard extends React.Component {
  render() {
    return (
      <div>
        <input type="text" ref="account" />

        <button type="submit" onClick={::this.onClickSubmit}>Add </button>
      </div>
    )
  }

  async onClickSubmit() {
    // TODO: usecareにする
    const account = this.refs.account.value
    const match = account.match(ACCOUNT_REX)

    if(!match) {
      throw new Error('invalid account')
    }

    const [_, username, host] = match
    const scopes = ['read', 'write', 'follow']

    // get or create OAuthApp
    let app

    try {
      app = await OAuthApp.query.getByIndex('host', host)
    } catch(e) {
      const requester = makeAPIRequester(
        MastodonAPISpec, {
          endpoint: `https://${host}/api/v1`,
        })
      const redirectUri = `${location.origin}/authorize`

      const rawAppData = await requester.postApp({
        client_name: 'naumanniskine',
        scopes: scopes.join(' '),
        redirect_uris: redirectUri,
      })
      app = new OAuthApp({
        host: host,
        ...rawAppData,
      })

      await Database.save(app)
    }

    require('assert')(app)

    // make auth link
    const authLink = [
      'https://', host, '/oauth/authorize',
      '?client_id=', encodeURIComponent(app.client_id),
      '&redirect_uri=', encodeURIComponent(`${location.origin}/authorize?host=${host}`),
      '&response_type=code',
      '&scope=', scopes.join('+')].join('')

    window.location.href = authLink
  }
}
