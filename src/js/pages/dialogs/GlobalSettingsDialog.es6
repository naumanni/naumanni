import React from 'react'
// import PropTypes from 'prop-types'

import Dialog from './Dialog'


/**
 * 設定ダイアログ
 */
export default class SettingsDialog extends Dialog {
  constructor(...args) {
    super(...args)

    this.state = {
      ...this.state,
    }
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
    return (
      <div className="settingDialogBody">
      </div>
    )
  }
}
