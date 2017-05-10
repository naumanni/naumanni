import {Status} from 'src/models'
import TimelineData from 'src/infra/TimelineData'


/**
 * そのうち大きく羽ばたくはず...
 */
class TimelineLoader {
  constructor(tokens, db=null) {
    this.tokens = tokens
    this.db = db || TimelineData
  }

  async loadHead() {
    const timeline = (await Promise.all(
      this.tokens.map((token) => this.loadRequest(token, {limit: 40})
    )))
      .map(({entities, result}) => this.db.mergeStatuses(entities, result))
      .reduce((timeline, statusRefs) => {
        return statusRefs
          .filter((s) => !timeline.find((old) => old.uri === s.uri))
          .concat(timeline)
      }, [])

    timeline.sort((a, b) => Status.compareCreatedAt(a.resolve(), b.resolve()))

    return timeline
  }

  loadRequest(token, query) {
    require('assert')(0, 'must implement at subclass')
  }
}


// TODO: 対象アカウントのインスタンスのTokenもってれば、そのTokenだけ使えばいい
export class AccountTimelineLoader extends TimelineLoader {
  constructor(account, ...args) {
    super(...args)
    this.account = account
  }

  loadRequest(token, query) {
    const id = this.account.getIdByHost(token.host)
    if(!id)
      return Promise.resolve({})

    return token.requester.listAccountStatuses({...query, id}, {token})
  }
}
