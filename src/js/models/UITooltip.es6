import {List, Record} from 'immutable'


const UITooltipGroupRecord = Record({  // eslint-disable-line new-cap
  tooltips: new List(),
})
export class UITooltipGroup extends UITooltipGroupRecord {
  constructor({tooltips}) {
    super({
      tooltips: new List(tooltips),
    })
  }
}
