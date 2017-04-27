import React from 'react'
// import PropTypes from 'prop-types'

import {makeAPIRequester} from 'src/api/APIRequester'
import MastodonAPISpec from 'src/api/MastodonAPISpec'
import OAuthApp from 'src/models/OAuthApp'
import Database from 'src/infra/Database'
import GenerateKeypairUseCase from 'src/usecases/GenerateKeypairUseCase'

import Dialog from './Dialog'

const ACCOUNT_REX = /^@([^@]+)@(.*)$/


/**
 * アカウント追加ダイアログ
 */
export default class AddAccountDialog extends Dialog {
  /**
   * override
   */
  componentDidMount() {
    super.componentDidMount()

    this.refs.account.focus()
  }

  /**
   * override
   */
  renderHeader() {
    return <h1>Mastodonアカウントを追加</h1>
  }

  /**
   * override
   */
  renderBody() {
    return (
      <div className="addAccountDialogBody">
        <p>Mastodonアカウントを入力して、追加ボタンを押して下さい。</p>

        <input type="text" ref="account" placeholder="@shn@mstdn.onosendai.jp" />
      </div>
    )
  }

  /**
   * override
   */
  renderFooter() {
    return (
      <div className="dialog-footerButtons">
        <button className="button-danger" onClick={::this.onClickClose}>キャンセル</button>
        <button className="button-primary" onClick={::this.onClickAdd}>追加</button>
      </div>
    )
  }

  onClickClose(e) {
    e.preventDefault()
    this.app.history.back()
  }

  onClickAdd(e) {
    e.preventDefault()

    const account = this.refs.account.value
    const match = account.match(ACCOUNT_REX)

    if(!match) {
      throw new Error('invalid account')
    }

    const [_, username, host] = match
    this.startAuthorize(username, host)
  }

  async startAuthorize(username, host) {
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
