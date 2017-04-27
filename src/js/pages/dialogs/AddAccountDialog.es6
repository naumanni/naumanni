import React from 'react'
// import PropTypes from 'prop-types'

import Dialog from './Dialog'

/**
 * 友達リストカラム
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

        <input type="text" ref="account" />
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
  }
}
