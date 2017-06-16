import {is, Map, fromJS} from 'immutable'
import React from 'react'
import {FormattedMessage as _FM} from 'react-intl'
// import PropTypes from 'prop-types'

import {LOCALES} from 'src/constants'
import {UserAcct, UserIconWithHost} from 'src/pages/uiComponents'
import UpdatePreferencesUseCase from 'src/usecases/UpdatePreferencesUseCase'
import {HistoryBaseDialog} from './Dialog'

import PublicKeyCache from 'src/infra/PublicKeyCache'
import GenerateKeypairUseCase from 'src/usecases/GenerateKeypairUseCase'


const TAB_PREFERENCES = 'TAB_PREFERENCES'
const TAB_NOTIFICATIONS = 'TAB_NOTIFICATIONS'
const TAB_PRIVACY = 'TAB_PRIVACY'
const TAB_EMERGENCY = 'TAB_EMERGENCY'


const tabs = [
  // PreferencesDialogの中にPreferencesタブとはこれいかに？
  [TAB_PREFERENCES, <_FM id="preferecens_dialog.tab.preferences" />],
  [TAB_NOTIFICATIONS, <_FM id="preferecens_dialog.tab.notifications" />],
  [TAB_PRIVACY, <_FM id="preferecens_dialog.tab.privacy" />],
  [TAB_EMERGENCY, <_FM id="preferecens_dialog.tab.emergency" />],
]

/**
 * 設定ダイアログ
 * PreferenceStoreに対応するのだから、PreferencesDialogでは?
 */
export default class PreferencesDialog extends HistoryBaseDialog {
  constructor(...args) {
    super(...args)

    this.state = {
      ...this.state,
      currentTab: tabs[0][0],
      currentPrivacyTab: null,
      myPublicKeys: {},
      ...this.getStateFromContext(),
      ...this.makePrefsState(),
    }
  }

  /**
   * @override
   */
  componentDidMount() {
    const {context} = this.context

    this.listenerRemovers.push(
      context.onChange(::this.onChangeContext),
    )
  }

  /**
   * @override
   * @private
   * @return {string}
   */
  get dialogClassName() {
    return super.dialogClassName + ' dialog--preferences'
  }

  /**
   * @override
   */
  renderHeader() {
    return <h1>Setting</h1>
  }

  /**
   * @override
   */
  renderBody() {
    const {currentTab} = this.state

    return (
      <div className="dialog-body">

        <ul className="tabs">
          {tabs.map(([tabId, title]) => {
            return (
              <li
                className={tabId === currentTab ? 'on' : ''}
                key={tabId} onClick={this.onClickTab.bind(this, tabId)}>{title}</li>
            )
          })}
        </ul>

        {this.renderPreferencesTab(currentTab === TAB_PREFERENCES)}
        {this.renderNotificationTab(currentTab === TAB_NOTIFICATIONS)}
        {this.renderPrivacyTab(currentTab === TAB_PRIVACY)}
        {this.renderEmergencyTab(currentTab === TAB_EMERGENCY)}
      </div>
    )
  }

  /**
   * @override
   */
  renderFooter() {
    const {initial, current} = this.state
    const canSave = !is(initial, current)

    return (
      <div className="dialog-footerButtons">
        <button className="button button--danger" onClick={::this.onClickClose}>
          <_FM id="preferecens_dialog.label.cancel" />
        </button>
        <button
          className="button button--primary"
          disabled={!canSave}
          onClick={::this.onClickSaveAndClose}>
          <_FM id="preferecens_dialog.label.save_n_close" />
        </button>
      </div>
    )
  }

  renderPreferencesTab(on) {
    return (
      <div className={`tabPane tabPane--preferences ${on ? 'on' : ''}`}>
        <div className="formGroup languageSetting">
          <h3><_FM id="preferecens_dialog.label.language" /></h3>
          <select
            value={this.getPrefVal(['globals', 'locale'], true)}
            onChange={this.onChangeForm.bind(this, ['globals', 'locale'])}>
            {Object.keys(LOCALES).map((key) => {
              return (
                <option key={key} value={key}>{LOCALES[key]}</option>
              )
            })}
          </select>
        </div>
      </div>
    )
  }

  renderNotificationTab(on) {
    const {tokens} = this.state

    const _cbox = (acct, key, props={}) => {
      let keyPath = ['byAccts', acct, ...key.split('.')]
      return (
        <input type="checkbox"
          checked={this.getPrefVal(keyPath, true)}
          onChange={this.onClickCheckbox.bind(this, keyPath)}
          {...props}
        />
      )
    }

    const disableDesktop = window.Notification ? false : true

    return (
      <div className={`tabPane tabPane--notification ${on ? 'on' : ''}`}>
        <p className="note">
          <_FM id="preferecens_dialog.note.notifications" />
        </p>

        {(window.Notification && Notification.permission === 'deneid') && (
        <p className="note note--danger">
          <_FM id="preferecens_dialog.note.notification_denied_warning" />
        </p>
        )}
        {disableDesktop && (
        <p className="note note--danger">
          <_FM id="preferecens_dialog.note.no_desktop_notification" />
        </p>
        )}

        <div className="notificationSetting">
        {tokens.map((token) => {
          const {account} = token
          const {acct} = account

          return (
            <div key={acct} className="notificationSetting-byAcct">
              <div className="notificationSetting-acctInfo">
                <UserIconWithHost account={account} />
                <UserAcct account={account} />
              </div>

              <h4><_FM id="preferecens_dialog.label.mention" /></h4>
              <div>
                <label>
                  {_cbox(acct, 'notifications.mention.audio')} <_FM id="preferecens_dialog.label.audio" />
                </label>
                <label>
                  {_cbox(acct, 'notifications.mention.desktop', {disabled: disableDesktop})
                  } <_FM id="preferecens_dialog.label.desktop" />
                </label>
              </div>

              <h4><_FM id="preferecens_dialog.label.reblog" /></h4>
              <div>
                <label>
                  {_cbox(acct, 'notifications.reblog.audio')} <_FM id="preferecens_dialog.label.audio" />
                </label>
                <label>
                  {_cbox(acct, 'notifications.reblog.desktop', {disabled: disableDesktop})
                  } <_FM id="preferecens_dialog.label.desktop" />
                </label>
              </div>

              <h4><_FM id="preferecens_dialog.label.favourite" /></h4>
              <div>
                <label>
                  {_cbox(acct, 'notifications.favourite.audio')} <_FM id="preferecens_dialog.label.audio" />
                </label>
                <label>
                  {_cbox(acct, 'notifications.favourite.desktop', {disabled: disableDesktop})
                  } <_FM id="preferecens_dialog.label.desktop" />
                </label>
              </div>

              <h4><_FM id="preferecens_dialog.label.follow" /></h4>
              <div>
                <label>
                  {_cbox(acct, 'notifications.follow.audio')} <_FM id="preferecens_dialog.label.audio" />
                </label>
                <label>
                  {_cbox(acct, 'notifications.follow.desktop', {disabled: disableDesktop})
                  } <_FM id="preferecens_dialog.label.desktop" />
                </label>
              </div>

            </div>
          )
        })}
        </div>
      </div>
    )
  }

  renderPrivacyTab(on) {
    const {tokens} = this.state
    let {currentPrivacyTab} = this.state

    if(!currentPrivacyTab && tokens.size) {
      currentPrivacyTab = tokens.get(0).acct
    }

    let currentToken = tokens.find((t) => t.acct === currentPrivacyTab)

    return (
      <div className={`tabPane tabPane--privacy ${on ? 'on' : ''}`}>
        <p className="note">
          このタブでは、メッセージ暗号化機能に関する設定を行います。
        </p>

        <ul className="tabs">
          {tokens.map((token) => {
            return (
              <li
                className={token.acct === currentPrivacyTab ? 'on' : ''}
                key={token.acct} onClick={this.onClickPrivacyTokenTab.bind(this, token)}>
                <UserIconWithHost account={token.account} />
              </li>
            )
          })}
        </ul>

        {currentToken && this.renderPrivacyTokenTab(currentToken)}
      </div>
    )
  }

  renderPrivacyTokenTab(token) {
    let publickeyForToken = this.state.myPublicKeys[token.acct]

    return (
      <div className="tabPane tabPane--privacyToken on">
        {token.acct}

        {token.hasKeyPair ? (
          <div>
            <div>このアカウントには以下の鍵ペアが設定されています。</div>
            <div>
              <h4>公開鍵</h4>
              {publickeyForToken
                ? <textarea readOnly="readonly" value={publickeyForToken.armor()} />
                : <div>読み込み中...</div>
              }
              <h4>秘密鍵</h4>
              <textarea readOnly="readonly" value={token.privateKeyArmored} />
            </div>
          </div>
        ) : (
          <div>このアカウントには鍵ペアが設定されていません。</div>
        )}
        <div>
          <button
            className="button button--danger"
            onClick={this.onClickRegenerateKeypair.bind(this, token)}
          >鍵ペアを再生成</button>
        </div>
      </div>
    )
  }

  renderEmergencyTab(on) {
    return (
      <div className={`tabPane tabPane--emeregency ${on ? 'on' : ''}`}>
        <p className="note note--danger">
          <_FM id="preferecens_dialog.note.emergency" />
        </p>

        <div className="tabPane--emeregency-resetAllButton">
          <button className="button button--danger" onClick={::this.onClickResetAll}>
            <_FM id="preferecens_dialog.label.reset_all" />
          </button>
        </div>
      </div>
    )
  }

  onChangeContext(changingStores) {
    this.setState(this.getStateFromContext())
  }

  onClickTab(tabId) {
    this.setState({currentTab: tabId})
  }

  onClickResetAll() {
    const {formatMessage: _} = this.context.intl
    if(window.confirm(_({id: 'preferences_dialog.confirm.reset_all'})))
      window.resetAll()
  }

  onChangeForm(keyPath, e) {
    const current = this.changePrefVal(keyPath, e.target.value)
    this.setState({current})
  }

  onClickCheckbox(keyPath, e) {
    const current = this.changePrefVal(keyPath, e.target.checked ? true : false)
    this.setState({current})
  }

  async onClickSaveAndClose() {
    await this.save()
    this.close()
  }

  onClickPrivacyTokenTab(token, e) {
    this.setState({currentPrivacyTab: token.acct})
    const account = token.account

    console.log(account.note, '->', account.plainNote)
    if(account.hasPublicKey) {
      //
      let publicKey = this.state.myPublicKeys[account.acct]
      if(publicKey === undefined) {
        this.setState({myPublicKeys: {
          ...this.state.myPublicKeys,
          [account.acct]: null,
        }})
        PublicKeyCache.fetchKey({keyId: account.publicKeyId, user: account.acct})
          .then((publicKey) => {
            this.setState({myPublicKeys: {
              ...this.state.myPublicKeys,
              [account.acct]: publicKey,
            }})
          })
      }
    }
  }

  onClickRegenerateKeypair(token) {
    const context = this.context.context

    context.useCase(
      new GenerateKeypairUseCase()
    ).execute(token, token.account)
      .then(() => {
        location.reload()
      })
  }

  getPrefVal(keyPath, defaultValue) {
    require('assert')(keyPath[0] === 'globals' || keyPath[0] === 'byAccts')
    let pref = this.state.current

    for(const key of keyPath) {
      if(!pref.has(key))
        return undefined || defaultValue

      pref = pref.get(key)
    }
    return pref
  }

  changePrefVal(keyPath, val, pref=undefined) {
    if(!pref) {
      require('assert')(keyPath[0] === 'globals' || keyPath[0] === 'byAccts')
      pref = this.state.current
    }

    return pref.set(keyPath[0],
      keyPath.length === 1
        ? val
        : this.changePrefVal([...keyPath].splice(1), val, pref.get(keyPath[0], new Map()))
    )
  }

  getStateFromContext() {
    const contextState = this.context.context.getState()
    const {tokens} = contextState.tokenState

    return {
      tokens,
    }
  }

  makePrefsState() {
    const {globals, byAccts} = this.context.context.getState().preferenceState
    return {
      // 最初のpref
      initial: new Map({globals: fromJS(globals), byAccts: fromJS(byAccts)}),
      // 編集中のpref
      current: new Map({globals: fromJS(globals), byAccts: fromJS(byAccts)}),
    }
  }

  async save() {
    const {context} = this.context
    const {current} = this.state

    await context.useCase(new UpdatePreferencesUseCase).execute(current.toJSON())
    this.setState(this.makePrefsState())
  }
}
