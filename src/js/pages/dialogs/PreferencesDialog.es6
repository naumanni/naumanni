import {is, Map, fromJS} from 'immutable'
import React from 'react'
import {FormattedMessage as _FM} from 'react-intl'
// import PropTypes from 'prop-types'

import {UserAcct, UserIconWithHost} from 'src/pages/parts'
import UpdatePreferencesUseCase from 'src/usecases/UpdatePreferencesUseCase'
import {HistoryBaseDialog} from './Dialog'


const TAB_NOTIFICATIONS = 'TAB_NOTIFICATIONS'
const TAB_EMERGENCY = 'TAB_EMERGENCY'


const tabs = [
  [TAB_NOTIFICATIONS, <_FM id="preferecens_dialog.tab.notifications" />],
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
      context.onChange(::this.onChangeConext),
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

        {this.renderNotificationTab(currentTab === TAB_NOTIFICATIONS)}
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

  renderNotificationTab(on) {
    const {tokens} = this.state

    const _cbox = (acct, key) => {
      let keyPath = ['byAccts', acct, ...key.split('.')]
      return (
        <input type="checkbox"
          checked={this.getPrefVal(keyPath, true)}
          onChange={this.onClickCheckbox.bind(this, keyPath)}
        />
      )
    }

    return (
      <div className={`tabPane tabPane--notification ${on ? 'on' : ''}`}>
        <p className="note">
          <_FM id="preferecens_dialog.note.notifications" />
        </p>

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
                  {_cbox(acct, 'notifications.mention.desktop')} <_FM id="preferecens_dialog.label.desktop" />
                </label>
              </div>

              <h4><_FM id="preferecens_dialog.label.reblog" /></h4>
              <div>
                <label>
                  {_cbox(acct, 'notifications.reblog.audio')} <_FM id="preferecens_dialog.label.audio" />
                </label>
                <label>
                  {_cbox(acct, 'notifications.reblog.desktop')} <_FM id="preferecens_dialog.label.desktop" />
                </label>
              </div>

              <h4><_FM id="preferecens_dialog.label.favourite" /></h4>
              <div>
                <label>
                  {_cbox(acct, 'notifications.favourite.audio')} <_FM id="preferecens_dialog.label.audio" />
                </label>
                <label>
                  {_cbox(acct, 'notifications.favourite.desktop')} <_FM id="preferecens_dialog.label.desktop" />
                </label>
              </div>

              <h4><_FM id="preferecens_dialog.label.follow" /></h4>
              <div>
                <label>
                  {_cbox(acct, 'notifications.follow.audio')} <_FM id="preferecens_dialog.label.audio" />
                </label>
                <label>
                  {_cbox(acct, 'notifications.follow.desktop')} <_FM id="preferecens_dialog.label.desktop" />
                </label>
              </div>

            </div>
          )
        })}
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

  onChangeConext(changingStores) {
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

  onClickCheckbox(keyPath, e) {
    const current = this.changePrefVal(keyPath, e.target.checked ? true : false)
    console.log(this.state.current.toJSON(), '->', current.toJSON())
    this.setState({current})
  }

  async onClickSaveAndClose() {
    await this.save()
    this.close()
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
