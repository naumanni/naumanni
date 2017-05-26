import React from 'react'
import {FormattedMessage as _FM} from 'react-intl'

import config from 'src/config'
import {HistoryBaseDialog} from './Dialog'


/**
 * ようこそ画面
 */
export default class WelcomeDialog extends HistoryBaseDialog {
  static propTypes = {
  }

  /**
   * @override
   */
  render() {
    const {WELCOME_DIALOG, PREFERRED_INSTANCE} = config
    let signUpUrl

    if(PREFERRED_INSTANCE) {
      // /auth/sign_upにはインスタンスの説明がないので、/に飛ばしたほうが良さそう
      // signUpUrl = `https://${PREFERRED_INSTANCE}/auth/sign_up`
      signUpUrl = `https://${PREFERRED_INSTANCE}/`
    }


    return (
      <div
        className={`${this.dialogClassName} dialog--welcome`}
        style={WELCOME_DIALOG.dialogStyle || {}}>

        <div className="welcome-note" dangerouslySetInnerHTML={{__html: WELCOME_DIALOG.html || ''}} />

        <div className="welcome-footer">
          <button className="button" onClick={::this.onClickSignin}>
            <_FM id="welcome_dialog.label.sign_in" />
          </button>
          {PREFERRED_INSTANCE &&
          <a className="button" href={signUpUrl} target="_blank">
            <_FM id="welcome_dialog.label.sign_up" />
          </a>
          }
        </div>

      </div>
    )
  }

  onClickSignin() {
    const {history} = this.context.app
    history.push(history.makeUrl('accountAdd'))
  }

  onClickSignup() {
    const {PREFERRED_INSTANCE} = config
  }
}
