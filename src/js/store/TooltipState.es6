import {is, List} from 'immutable'

import * as actions from 'src/actions'


export default class TooltipState {
  /**
   * @param {UITooltipGroup[]} tooltips
   */
  constructor(tooltips=[]) {
    this.tooltips = new List(tooltips)
  }

  reduce(payload) {
    switch(payload.type) {
    case actions.TOOLTIP_ADD_REQUESTED:
      return this.onTooltipAddRequested(payload.tooltip)
    case actions.TOOLTIP_REMOVE_REQUESTED:
      return this.onTooltipRemoveRequested(payload.tooltip)
    default:
      return this
    }
  }

  onTooltipAddRequested(tooltip) {
    return new TooltipState([...this.tooltips, tooltip])
  }

  onTooltipRemoveRequested(tooltip) {
    const idx = this.tooltips.findIndex((x) => is(x, tooltip))
    if(idx < 0)
      return this

    const newarray = [...this.tooltips]
    newarray.splice(idx, 1)
    return new TooltipState(newarray)
  }
}
