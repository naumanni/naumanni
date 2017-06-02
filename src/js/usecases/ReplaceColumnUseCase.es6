import {UseCase} from 'almin'

import * as actions from 'src/actions'
import {UIColumn} from 'src/models'

/**
 * カラムを入れ替えるUsecase
 */
export default class ReplaceColumnUseCase extends UseCase {
  constructor() {
    super()
  }

  /**
   * @override
   * @param {UIColumn} target
   * @param {string} type
   * @param {object} params
   */
  async execute(target, type, params) {
    this.dispatch({
      type: actions.COLUMN_REPLACE_REQUESTED,
      target,
      column: new UIColumn(type, params),
    })
  }
}
