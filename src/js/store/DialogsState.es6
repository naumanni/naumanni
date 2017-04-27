import * as actions from 'src/actions'
import {UIDialog} from 'src/models'


export default class DialogsState {
  /**
   * @param {UIDialog[]} dialogs
   */
  constructor(dialogs=[]) {
    this.dialogs = dialogs
  }

  reduce(payload) {
    switch(payload.type) {
    case actions.DIALOG_PUSH_REQUESTED:
      return this.onDialogPushRequested(payload.dialog)
    case actions.DIALOG_CLOSE_REQUESTED:
      return this.onDialogCloseRequested(payload.dialog)
    case actions.DIALOG_REPLACE_REQUESTED:
      return this.onDialogReplaceRequested(payload.dialogs)
    default:
      return this
    }
  }

  onDialogPushRequested(dialog) {
    return new DialogsState([...this.dialogs, dialog])
  }

  onDialogCloseRequested(dialog) {
    const idx = this.dialogs.findIndex((x) => UIDialog.isEqual(x, dialog))
    if(idx < 0)
      return this

    const newdialogs = [...this.dialogs]
    newdialogs.splice(idx, 1)
    return new DialogsState(newdialogs)
  }

  onDialogReplaceRequested(dialogs) {
    return new DialogsState(dialogs)
  }
}
