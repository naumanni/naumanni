import React from 'react'
import {FormattedMessage as _FM} from 'react-intl'
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
        // build error message
        const {formatMessage: _} = this.context.intl
        let message

        if(error.response && error.response.body && error.response.body.error &&
           error.response.body.error_description) {
          message = _({id: 'authorize_account_dialog.progress.error_json'}, error.response.body)
        } else if(error.message) {
          message = _({id: 'authorize_account_dialog.progress.error_message'}, {message: error.message})
        } else {
          message = _({id: 'authorize_account_dialog.progress.error_message'}, {message: '' + error})
        }

        this.setState({error: message})
      })
  }

  /**
   * @override
   */
  render() {
    const {error} = this.state

    return (
      <div className={this.dialogClassName}>
        {error
          ? <p className="has-error">{error}</p>
          : <p><_FM id="authorize_account_dialog.progress.authorizing" /></p>
        }

        {error && (
          <div className="dialog-footer">
            <div className="dialog-footerButtons">
              <button className="button button--danger" onClick={::this.onClickClose}>Close</button>
            </div>
          </div>
        )}
      </div>
    )
  }

  /**
   * @override
   * @private
   * @return {string}
   */
  get dialogClassName() {
    return super.dialogClassName + ' dialog--authorization'
  }

  onClickClose() {
    const {history} = this.context.app
    history.push(history.makeUrl('top'))
  }
}
