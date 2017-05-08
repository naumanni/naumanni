import {UseCase} from 'almin'

import * as actions from 'src/actions'
import {UIColumn} from 'src/models'

/**
 * カラムを追加するUseCase
 */
export default class AddColumnUseCase extends UseCase {
  constructor() {
    super()
  }

  /**
   * @override
   * @param {string} type
   * @param {object} params
   */
  async execute(type, params) {
    const column = new UIColumn(type, params)

    this.dispatch({
      type: actions.COLUMN_ADD_REQUESTED,
      column: column,
    })
  }
}
