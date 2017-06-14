import React from 'react'
import PropTypes from 'prop-types'

import {
  DIALOG_ADD_ACCOUNT, DIALOG_AUTHORIZE_ACCOUNT, DIALOG_MEDIA_VIEWER, DIALOG_USER_DETAIL, DIALOG_GLOBAL_PREFERENCES,
  DIALOG_SEARCH, DIALOG_WELCOME,
} from 'src/constants'
import {UIDialogPropType} from 'src/propTypes'


/**
 * ダイアログのコンテナ
 */
export default class ModalDialogContainer extends React.Component {
  static propTypes = {
    dialogs: PropTypes.arrayOf(UIDialogPropType).isRequired,
  }

  /**
   * @override
   */
  render() {
    const {dialogs} = this.props

    if(!dialogs.length)
      return null

    return (
      <div className="modalDialogContainer" onClick={::this.onClickBackground} ref="background">
        {dialogs.map((dialog, idx) => {
          const dialogClass = this.dialogClassByType(dialog.type)

          return React.createElement(
            dialogClass, {
              key: dialog.key,
              dialog: dialog,
              visible: idx === dialogs.length - 1 ? true : false,
              ref: idx === dialogs.length - 1 ? 'top' : null,
              ...dialog.params,
            })
        })}
      </div>
    )
  }

  // TODO:しょぼい
  dialogClassByType(type) {
    switch(type) {
    case DIALOG_ADD_ACCOUNT: return require('src/pages/dialogs/AddAccountDialog').default
    case DIALOG_AUTHORIZE_ACCOUNT: return require('src/pages/dialogs/AuthorizeAccountDialog').default
    case DIALOG_MEDIA_VIEWER: return require('src/pages/dialogs/MediaViewerDialog').default
    case DIALOG_USER_DETAIL: return require('src/pages/dialogs/UserDetailDialog').default
    case DIALOG_GLOBAL_PREFERENCES: return require('src/pages/dialogs/PreferencesDialog').default
    case DIALOG_SEARCH: return require('src/pages/dialogs/SearchDialog').default
    case DIALOG_WELCOME: return require('src/pages/dialogs/WelcomeDialog').default
    default: require('assert')(0, 'invalid dialog type')
    }
  }

  onClickBackground(e) {
    if(e.target === this.refs.background) {
      e.stopPropagation()

      const dialog = this.refs.top

      if(dialog.onClickBackground)
        dialog.onClickBackground(e)
    }
  }
}
