import {List} from 'immutable'
import {
  TIMELINE_FILTER_BOOST, TIMELINE_FILTER_REPLY,
} from 'src/constants'
import Notification from './Notification'
import Status from './Status'
import ChangeEventEmitter from 'src/utils/EventEmitter'


/**
 * Timelineです。
 * TODO: Modelにうつす
 */
class Timeline extends ChangeEventEmitter {
  constructor(max) {
    super()

    this._max = max
    // this._timeline = new List()
    // null means non loaded timeline, empty List means empty timeline
    this._originalTimeline = this._timeline = null
    this._filters = new Map()
  }

  /**
   * StatusをTimelineに追加する
   * @private
   * @param {List<Ref>} newRefs
   * @param {object} options
   * @return {List<Ref>} mergeされなかったrefs
   */
  push(newRefs, options) {
    let result

    // lockされてないので、primary timelineにmergeする
    const {merged, removes} = mergeTimeline(this.timeline, newRefs, this.compare, this._max)

    result = removes
    if(!merged.equals(this._timeline)) {
      this._update(merged)
    }

    return result
  }

  /**
   * Statusフィルタをupdate
   * @param {Map<string, boolean>} filters
   */
  updateFilter(filters) {
    this._filters = filters
    this._originalTimeline && this._update(this._originalTimeline)
  }

  _update(newRefs) {
    if(!newRefs.equals(this._originalTimeline)) {
      this._originalTimeline = newRefs
    }
    this._timeline = this._filtered(newRefs)
    this.emitChange()
  }

  /**
   * Statusをフィルタする
   * @param {List<Ref>} refs
   * @return {List<Ref>} フィルタされたrefs
   */
  _filtered(refs) {
    for(const [type, toggle] of this._filters.entries()) {
      if(toggle)
        continue

      if(type === TIMELINE_FILTER_BOOST) {
        refs = refs.filter((ref) => (
          ![...ref.resolve().reblogged_by_acct.values()]
            .includes(true))
        )
      } else if(type === TIMELINE_FILTER_REPLY) {
        refs = refs.filter((ref) => (
          ![...ref.resolve().in_reply_to_account_id_by_host.values()]
            .reduce((prev, id) => prev && id != null, true)
        ))
      }
    }

    return refs
  }

  /**
   * TimelineからStatusを削除する
   * @param {string} uri
   */
  delete(uri) {
    const idx = this.timeline.findIndex((ref) => ref.resolve().uri === uri)

    if(idx >= 0) {
      this._timeline = this.timeline.delete(idx)
      this.emitChange()
    }
  }

  get timeline() {
    return this._timeline || new List()
  }

  // timelineの中に含まれるuriのリストを返す
  get uris() {
    require('assert')(0, 'not implemented')
  }

  getMinIdForHost(host) {
    let minId = null

    for(const ref of this._timeline) {
      const id = ref.resolve().getIdByHost(host)
      if(id && (!minId || id < minId)) {
        minId = id
      }
    }

    return minId
  }

  /**
   * 自分のCloneを返す。EventListenerはCloneしない
   * @return {Timeline}
   */
  clone() {
    const newTL = new this.constructor(this._max)

    newTL._originalTimeline = newTL._timeline = this._timeline
    return newTL
  }

  set max(newMax) {
    this._max = newMax
  }

  hasChanges({accounts, statuses}) {
    return true
  }

  // private
  compare() {
    require('assert')('not implemented')
  }
}


export class StatusTimeline extends Timeline {
  get uris() {
    return this.timeline.map((ref) => ref.uri)
  }

  hasChanges({accounts, statuses}) {
    return this.timeline.find((ref) => {
      if(statuses[ref.uri] || accounts[ref.accountUri])
        return true
      const {reblogRef} = ref
      if(reblogRef && (statuses[reblogRef.uri] || accounts[reblogRef.accountUri]))
        return true
      return false
    }) ? true : false
  }

  compare(a, b) {
    return Status.compareForTimeline(a.resolve(), b.resolve())
  }
}


export class NotificationTimeline extends Timeline {
  /**
   * @override
   */
  delete(uri) {
    const idx = this.timeline.findIndex((ref) => {
      const accountRef = ref.accountRef
      if(accountRef)
        return accountRef.uri === uri
      const statusRef = ref.statusRef
      if(statusRef)
        return statusRef.uri === uri
      return false
    })

    if(idx >= 0) {
      this._timeline = this.timeline.delete(idx)
      this.emitChange()
    }
  }

  get uris() {
    const self = this
    return Array.from((function* () {
      for(const ref of self.timeline) {
        const accountRef = ref.accountRef
        if(accountRef)
          yield accountRef.uri
        const statusRef = ref.statusRef
        if(statusRef)
          yield statusRef.uri
      }
    })())
  }

  hasChanges({accounts, statuses}) {
    return this.timeline.find((ref) => {
      const accountRef = ref.accountRef
      if(accountRef && (accounts[accountRef.uri]))
        return true
      const statusRef = ref.statusRef
      if(statusRef && (statuses[statusRef.uri] || accounts[statusRef.accountUri]))
        return true
      const reblogRef = statusRef && statusRef.reblogRef
      if(reblogRef && (statuses[reblogRef.uri] || accounts[reblogRef.accountUri]))
        return true
      return false
    }) ? true : false
  }

  compare(a, b) {
    return Notification.compareForTimeline(a, b)
  }
}


/**
 * iterをtesterの返り値で２つに分ける
 * @param {Iterable} iter
 * @param {func} tester
 * @return {List} t true
 * @return {List} f false
 */
function filterSplit(iter, tester) {
  let t = new List()
  let f = new List()

  t = t.asMutable()
  f = f.asMutable()
  for(const value of iter) {
    (tester(value) ? t : f).push(value)
  }
  t = t.asImmutable()
  f = f.asImmutable()
  return {t, f}
}


function mergeTimeline(list, iter, comparator, max) {
  let {t: removes, f: appends} = filterSplit(iter, (ref) => list.find((a) => a.uri === ref.uri) ? true : false)

  if(appends.isEmpty())
    return {merged: list, appends, removes}

  let merged = list.concat(appends).sort(comparator)
  if(max && merged.size > max) {
    removes = merged.slice(max).concat(removes)
    merged = merged.take(max)
  }

  return {
    merged, appends, removes,
  }
}
