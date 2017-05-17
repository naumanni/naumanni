import React from 'react'
// import PropTypes from 'prop-types'


import AuthorizeAccountUseCase from 'src/usecases/AuthorizeAccountUseCase'
import Dialog from './Dialog'


/**
 * 認証進捗ダイアログ
 */
export default class AuthorizeAccountDialog extends Dialog {
  constructor(...args) {
    super(...args)

    this.state = {
      ...this.state,
      progress: '',
      error: null,
    }
  }

  /**
   * @override
   */
  componentDidMount() {
    super.componentDidMount()

    const {context} = this.context
    const {history} = this.app
    const {code, host} = this.props.dialog.params

    // TODO:check code, host
    const redirectUri =
      history.useHash
        ? `${window.location.origin}/?action=authorize&host=${host}`
        : history.makeUrl('authorize', null, {external: true}) + `?&host=${host}`
    context.useCase(new AuthorizeAccountUseCase).execute(host, code, redirectUri)
      .then(() => {
        this.app.history.replace('/')
      }, (error) => {
        this.setState({error: '' + error})
      })
  }

  /**
   * @override
   */
  renderHeader() {
    return <h1>Mastodonアカウントを認証中...</h1>
  }

  /**
   * @override
   */
  renderBody() {
    return (
      <div className="authorizeAccountDialogBody">
        {this.state.progress}
        {this.state.error && <p className="error">{this.state.error}</p>}
      </div>
    )
  }

  /**
   * @override
   */
  renderFooter() {
    if(this.state.error) {
      <div className="dialog-footerButtons">
        <button className="button-danger" onClick={::this.onClickClose}>Close</button>
      </div>
    }
  }
}
