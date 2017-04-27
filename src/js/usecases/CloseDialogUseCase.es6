import {UseCase} from 'almin'

import * as actions from 'src/actions'

/**
 * ダイアログを閉じるUseCase
 */
export default class CloseDialogUseCase extends UseCase {
  constructor() {
    super()
  }

  /**
   * @override
   * @param {UIDialog} dialog
   */
  async execute(dialog) {
    this.dispatch({
      type: actions.DIALOG_CLOSE_REQUESTED,
      dialog,
    })
  }
}
