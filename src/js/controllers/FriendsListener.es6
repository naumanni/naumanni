import {TalkRecord} from 'src/models'
import ChangeEventEmitter from 'src/utils/EventEmitter'


const _STATE_INITIAL = 'initial'
const _STATE_LOADING = 'loading'
const _STATE_WATCHING = 'watching'


class UIFriend {
  constructor(account) {
    this.account = account
    this.record = null
  }

  get key() {
    return this.account.uri
  }

  static compare(a, b) {
    if(a.record && !b.record) {
      return -1
    } else if(!a.record && b.record) {
      return 1
    } else if(a.record && b.record) {
      const dateA = a.record.latestStatusReceivedAtMoment
      const dateB = b.record.latestStatusReceivedAtMoment

      if(dateA.isBefore(dateB))
        return 1
      else if(dateA.isAfter(dateB))
        return -1
      else
        return 0
    } else if(!a.record && !b.record) {
      const acctA = a.account.acct.toLowerCase()
      const acctB = b.account.acct.toLowerCase()

      if(acctA > acctB)
        return 1
      else if(acctA < acctB)
        return -1
      else
        return 0
    }
  }
}


export default class FriendsListener extends ChangeEventEmitter {
  constructor(subject) {
    super()
    this.subject = subject
    this.token = null
    this.state = {
      friends: null,
      loadStatus: _STATE_INITIAL,
    }
  }

  get isLoading() {
    return this.state.loadStatus !== _STATE_WATCHING
  }

  open(token) {
    this.token = token
    this.refresh()
  }

  updateToken(token) {
    this.token = token
    this.refresh()
  }

  async refresh() {
    if(!this.token)
      return

    this.state.loadStatus = _STATE_LOADING

    const {requester, account} = this.token
    const myId = account.getIdByHost(this.token.host)
    const friends = new Map()

    const diggFollowxxxs = async (id, fetcher) => {
      let nextUrl

      for(;;) {
        const {entities, link} = await fetcher({id, limit: 80}, {endpoint: nextUrl})
        const {accounts} = entities
        if(!accounts)
          break

        Object.values(accounts).forEach((account) => {
          if(!friends.has(account.acct))
            friends.set(account.acct, new UIFriend(account))
        })
        nextUrl = link && link.next
        if(!nextUrl)
          break
      }
    }

    await Promise.all([
      diggFollowxxxs(myId, ::requester.listFollowings),
      diggFollowxxxs(myId, ::requester.listFollowers),
    ])

    this.sortFriends(friends)
  }

  async sortFriends(friends=null) {
    if(!friends) {
      friends = new Map()
      if(this.state.friends) {
        for(const friend of this.state.friends) {
          friends.set(friend.account.acct, friend)
        }
      }
    }

    // TODO: すげー雑
    const records = await TalkRecord.query.listByKey('subject', this.subject)
    for(const record of records) {
      // いまのところrecordのtargetは1人
      require('assert')(record.targets.size === 1)
      const friend = friends.get(record.targets.get(0))
      if(friend)
        friend.record = record
    }

    // friend list
    const friendList = Array.from(friends.values())

    friendList.sort(UIFriend.compare)
    this.state.friends = friendList
    this.state.loadStatus = _STATE_WATCHING
    this.emitChange()
  }
}
