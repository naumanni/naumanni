import React from 'react'
import PropTypes from 'prop-types'

import {DIALOG_ADD_ACCOUNT} from 'src/constants'
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
      <div className="modalDialogContainer">
        {dialogs.map((dialog, idx) => {
          const dialogClass = this.dialogClassByType(dialog.type)

          return React.createElement(
            dialogClass, {
              key: dialog.key,
              dialog: dialog,
              visible: idx === dialogs.length - 1 ? true : false,
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
    }
  }
}
