import * as actions from 'src/actions'
import {UIColumn} from 'src/models'
import {
  COLUMN_TIMELINE, COLUMN_FRIENDS,
  TIMELINE_FEDERATION, TIMELINE_LOCAL, TIMELINE_HOME, SUBJECT_MIXED,
} from 'src/constants'


export default class ColumnState {
  /**
   * @param {Column[]} columns
   */
  constructor(columns=[]) {
    this.columns = columns
  }

  reduce(payload) {
    switch(payload.type) {
    case actions.COLUMN_ADD_REQUESTED:
      return this.onColumnAddRequested(payload.column)
    case actions.COLUMN_REMOVE_REQUESTED:
      return this.onColumnRemoveRequested(payload.column)
    case actions.COLUMN_REPLACE_REQUESTED:
      return this.onColumnReplaceRequested(payload.target, payload.column)
    case actions.COLUMN_SWAP_REQUESTED:
      return this.onColumnSwapRequested(payload.from, payload.to)
    default:
      return this
    }
  }

  onColumnAddRequested(column) {
    require('assert')(column)
    // 既に追加されていたら追加しない
    const old = this.columns.find((x) => UIColumn.isEqual(x, column))
    if(old)
      return this

    return new ColumnState([...this.columns, column])
  }

  onColumnRemoveRequested(column) {
    require('assert')(column)
    const idx = this.columns.findIndex((x) => UIColumn.isEqual(x, column))
    if(idx < 0)
      return this

    const newcolumns = [...this.columns]
    newcolumns.splice(idx, 1)
    return new ColumnState(newcolumns)
  }

  onColumnReplaceRequested(target, column) {
    require('assert')(column)
    const idx = this.columns.findIndex((x) => UIColumn.isEqual(x, target))
    if(idx < 0)
      return this

    const newcolumns = [...this.columns]
    newcolumns.splice(idx, 1, column)
    return new ColumnState(newcolumns)
  }

  onColumnSwapRequested(from, to) {
    const newcolumns = [...this.columns]
    newcolumns[from] = newcolumns.splice(to, 1, newcolumns[from])[0]
    return new ColumnState(newcolumns)
  }

  static fromJSON(jsonobj) {
    return new this(
      jsonobj.map((x) => {
        // SymbolがJSONizeできないので...
        if(x.type === COLUMN_TIMELINE && !x.params.subject)
          x.params.subject = SUBJECT_MIXED

        return new UIColumn(x.type, x.params)
      })
    )
  }

  toJSON() {
    return this.columns
  }
}
