import {UseCase} from 'almin'

import * as actions from 'src/actions'
import {UIDialog} from 'src/models'

/**
 * ダイアログをごっそり入れ替えるUseCase
 */
export default class ReplaceDialogsUseCase extends UseCase {
  constructor() {
    super()
  }

  /**
   * @override
   * @param {object[]} dialogs
   */
  async execute(dialogs) {
    this.dispatch({
      type: actions.DIALOG_REPLACE_REQUESTED,
      dialogs: dialogs.map(({type, params}) => new UIDialog(type, params)),
    })
  }
}
