import React from 'react'
// import PropTypes from 'prop-types'

import {makeAPIRequester} from 'src/api/APIRequester'
import MastodonAPISpec from 'src/api/MastodonAPISpec'
import OAuthApp from 'src/models/OAuthApp'
import Database from 'src/infra/Database'
// import GenerateKeypairUseCase from 'src/usecases/GenerateKeypairUseCase'

import {HistoryBaseDialog} from './Dialog'

const ACCOUNT_REX = /^@([^@]+)@(.*)$/


/**
 * アカウント追加ダイアログ
 */
export default class AddAccountDialog extends HistoryBaseDialog {
  /**
   * override
   */
  componentDidMount() {
    super.componentDidMount()

    this.refs.account.focus()
  }

  /**
   * @override
   */
  renderHeader() {
    return <h1>Add your account</h1>
  }

  /**
   * @override
   */
  renderBody() {
    return (
      <div className="dialog-body">
        <input type="text" ref="account" placeholder="@shn@mstdn.onosendai.jp" style={{width: '100%'}} />
      </div>
    )
  }

  /**
   * @override
   */
  renderFooter() {
    return (
      <div className="dialog-footerButtons">
        <button className="button-danger" onClick={::this.onClickClose}>Cancel</button>
        <button className="button-primary" onClick={::this.onClickAdd}>Add</button>
      </div>
    )
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
    const {history} = this.app

    // get or create OAuthApp
    let app

    try {
      app = await OAuthApp.query.getByIndex('host', host)
    } catch(e) {
      const requester = makeAPIRequester(
        MastodonAPISpec, {
          endpoint: `https://${host}/api/v1`,
        })
      // const redirectUri = history.makeUrl('top', null, {external: true})
      const redirectUri =
        history.useHash
          ? `${window.location.origin}/`
          : history.makeUrl('authorize', null, {external: true})
      const {result: rawAppData} = await requester.postApp({
        client_name: 'naumanni',
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
    // mastodonのredirectUriにはhashを含めることが出来ない
    const redirectUri =
      history.useHash
        ? `${window.location.origin}/?action=authorize&host=${host}`
        : history.makeUrl('authorize', null, {external: true}) + `?&host=${host}`
    const authLink = [
      'https://', host, '/oauth/authorize',
      '?client_id=', encodeURIComponent(app.client_id),
      '&redirect_uri=', encodeURIComponent(redirectUri),
      '&response_type=code',
      '&scope=', scopes.join('+')].join('')

    window.location.href = authLink
  }
}
