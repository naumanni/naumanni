import React from 'react'
import {FormattedMessage as _FM} from 'react-intl'
// import PropTypes from 'prop-types'

import config, {getServerRoot} from 'src/config'
import {NAUMANNI_PREFERRED_INSTANCES} from 'src/constants'
import {makeAPIRequester} from 'src/api/APIRequester'
import MastodonAPISpec from 'src/api/MastodonAPISpec'
import OAuthApp from 'src/models/OAuthApp'
import Database from 'src/infra/Database'
// import GenerateKeypairUseCase from 'src/usecases/GenerateKeypairUseCase'

import {HistoryBaseDialog} from './Dialog'

const HOSTNAME_REX = /^(?:[^.]+\.)*[^.]+$/


/**
 * アカウント追加ダイアログ
 */
export default class AddAccountDialog extends HistoryBaseDialog {
  /**
   * override
   */
  componentDidMount() {
    super.componentDidMount()
    this.refs.hostname.focus()
  }

  /**
   * @override
   */
  renderHeader() {
    return <h1><_FM id="add_account_dialog.title" /></h1>
  }

  /**
   * @override
   */
  renderBody() {
    const {formatMessage: _} = this.context.intl
    const {hasError} = this.state
    const {PREFERRED_INSTANCE, PREFERRED_INSTANCE_FAVICON_URL} = config
    let faviconUrl = PREFERRED_INSTANCE_FAVICON_URL || `https://${PREFERRED_INSTANCE}/favicon.ico`

    return (
      <div className="dialog-body addAccount">
        <p className="note">
          <_FM id="add_account_dialog.note.add_account" />
        </p>

        {!PREFERRED_INSTANCE &&
        <div className="niceBorder"><span><_FM id="add_account_dialog.label.major_instances" /></span></div>
        }

        <div className="addAccount-instances">
          {PREFERRED_INSTANCE ? (
          <button className="button" onClick={this.onClickInstance.bind(this, PREFERRED_INSTANCE)}>
            <img className="favicon" src={faviconUrl} />
            <div>{PREFERRED_INSTANCE}</div>
          </button>
          ) : (
          NAUMANNI_PREFERRED_INSTANCES.map(([hostname, faviconUrl]) => (
            <button
              className="button"
              onClick={this.onClickInstance.bind(this, hostname)}
              key={hostname}>
              <img className="favicon" src={faviconUrl || `https://${hostname}/favicon.ico`} />
              <div>{hostname}</div>
            </button>
          ))
          )}
        </div>

        <div className="niceBorder"><span><_FM id="add_account_dialog.label.another_instance" /></span></div>

        <input
          type="text" ref="hostname"
          className={`addAccount-hostnameInput ${hasError ? 'has-error' : ''}`}
          placeholder={_({id: 'add_account_dialog.label.hostname_placeholder'})} />
      </div>
    )
  }

  /**
   * @override
   */
  renderFooter() {
    return (
      <div className="dialog-footerButtons">
        <button className="button button--danger" onClick={::this.onClickClose}>
          <_FM id="add_account_dialog.label.cancel" />
        </button>
        <button className="button button--primary" onClick={::this.onClickAdd}>
          <_FM id="add_account_dialog.label.add" />
        </button>
      </div>
    )
  }

  onClickInstance(instance, e) {
    e.preventDefault()
    this.refs.hostname.value = instance

    this.onClickAdd()
  }

  onClickAdd(e) {
    e && e.preventDefault()

    this.setState({hasError: false})
    const hostname = this.refs.hostname.value.trim()
    if(!HOSTNAME_REX.test(hostname)) {
      this.setState({hasError: true})
      this.refs.hostname.focus()
      return
    }
    this.startAuthorize(hostname)
  }

  async startAuthorize(host) {
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
          ? getServerRoot()
          : history.makeUrl('authorize', null, {external: true})
      const {result: rawAppData} = await requester.postApp({
        client_name: 'naumanni',
        scopes: scopes.join(' '),
        redirect_uris: redirectUri,
        website: getServerRoot(),
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
