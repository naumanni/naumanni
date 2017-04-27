import {UseCase} from 'almin'

import * as actions from 'src/actions'
import {UIDialog} from 'src/models'

/**
 * ダイアログを追加するUseCase
 */
export default class PushDialogUseCase extends UseCase {
  constructor() {
    super()
  }

  /**
   * @override
   * @param {string} type
   * @param {object} params
   */
  async execute(type, params) {
    this.dispatch({
      type: actions.DIALOG_PUSH_REQUESTED,
      dialog: new UIDialog(type, params),
    })
  }
}
