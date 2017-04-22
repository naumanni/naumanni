import React from 'react'

import {makeAPIRequester} from 'src/api/APIRequester'
import MastodonAPISpec from 'src/api/MastodonAPISpec'
import OAuthApp from 'src/models/OAuthApp'
import Database from 'src/infra/Database'


const ACCOUNT_REX = /^@([^@]+)@(.*)$/


export default class AccountsPage extends React.Component {
  render() {
    return (
      <div className="page page-accounts">

        <ul className="mastodonAccounts">
          <li className="mastodonAccounts-addForm">
            <AddMastodonAccountWizard />
          </li>
        </ul>

      </div>
    )
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
    // const account = this.refs.account.value
    const account = '@shn@oppai.tokyo'
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
