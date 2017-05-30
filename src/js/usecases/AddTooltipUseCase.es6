import {UseCase} from 'almin'

import * as actions from 'src/actions'


/**
 * ツールチップを追加するUseCase
 */
export class AddTooltipUseCase extends UseCase {
  constructor() {
    super()
  }

  /**
   * @override
   * @param {UITooltipGroup} tooltip
   */
  async execute(tooltip) {
    this.dispatch({
      type: actions.TOOLTIP_ADD_REQUESTED,
      tooltip: tooltip,
    })
  }
}


/**
 * ツールチップを削除するUseCase
 */
export class RemoveTooltipUseCase extends UseCase {
  constructor() {
    super()
  }

  /**
   * @override
   * @param {UITooltipGroup} tooltip
   */
  async execute(tooltip) {
    this.dispatch({
      type: actions.TOOLTIP_REMOVE_REQUESTED,
      tooltip: tooltip,
    })
  }
}
