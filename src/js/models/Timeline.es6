import {List} from 'immutable'

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
    this._timeline = new List()
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
    const {merged, removes} = mergeTimeline(this._timeline, newRefs, this.compare, this._max)

    result = removes
    if(!merged.equals(this._timeline)) {
      this._timeline = merged
      this.emitChange()
    }

    return result
  }

  get timeline() {
    return this._timeline
  }

  getMinStatusIdForHost(host) {
    let lastStatusId = null

    for(const status of this._timeline) {
      const statusId = status.resolve().getIdByHost(host)
      if(statusId && (!lastStatusId || statusId < lastStatusId)) {
        lastStatusId = statusId
      }
    }

    return lastStatusId
  }

  /**
   * 自分のCloneを返す。EventListenerはCloneしない
   * @return {Timeline}
   */
  clone() {
    const newTL = new Timeline(this._max)

    newTL._timeline = this._timeline
    return newTL
  }

  set max(newMax) {
    this._max = newMax
  }

  // private
  compare() {
    require('assert')('not implemented')
  }
}


export class StatusTimeline extends Timeline {
  compare(a, b) {
    return Status.compareCreatedAt(a.resolve(), b.resolve())
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
    return list

  let merged = list.concat(appends).sort(comparator)
  if(max && merged.size > max) {
    removes = merged.slice(max).concat(removes)
    merged = merged.take(max)
  }

  return {
    merged, appends, removes,
  }
}


