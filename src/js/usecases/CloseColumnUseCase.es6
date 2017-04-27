import {UseCase} from 'almin'

import * as actions from 'src/actions'

/**
 * カラムを追加するUseCase
 */
export default class CloseColumnUseCase extends UseCase {
  constructor() {
    super()
  }

  /**
   * @override
   * @param {UIColumn} column
   */
  async execute(column) {
    this.dispatch({
      type: actions.COLUMN_REMOVE_REQUESTED,
      column: column,
    })
  }
}
