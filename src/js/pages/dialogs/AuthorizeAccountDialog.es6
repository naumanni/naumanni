import React from 'react'
// import PropTypes from 'prop-types'


import AuthorizeAccountUseCase from 'src/usecases/AuthorizeAccountUseCase'
import {parseQuery} from 'src/utils'
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
    const {code, host} = parseQuery(location.search)

    // TODO:check code, host
    context.useCase(new AuthorizeAccountUseCase).execute(host, code)
      .then(() => {
        this.app.history.pushState({}, null, '/')
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
        <button className="button-danger" onClick={::this.onClickClose}>閉じる</button>
      </div>
    }
  }

  /**
   * @override
   */
  close() {
    this.app.history.pushState({}, null, '/')
  }
}
