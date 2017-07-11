import {normalize, schema} from 'normalizr'
import {List, Map} from 'immutable'

import {Account, Notification, Status} from 'src/models'
import APISpec from './APISpec'


const account = new schema.Entity('accounts')
const status = new schema.Entity('statuses', {
  account: account,
  reblog: new schema.Entity('statuses'),
})
status.schema.reblog = status
const notification = new schema.Entity('notifications', {
  account: account,
  status: status,
})
const result = new schema.Entity('results', {
  accounts: [account],
  statuses: [status],
  hashtags: new schema.Entity('hashtags'),
})


const HOST_REX = /^https?:\/\/([^/]+)\//


export function normalizeResponse(entity, {result: responseBody, ...response}, host, acct=null) {
  let {entities, result} = normalize(responseBody, entity)
  let entitiesByUrl = {}

  // TODO:normalizしているコードをModelの方に移す
  if(entities.accounts) {
    entities.accounts = Object.keys(entities.accounts).reduce(
      (map, key) => {
        const data = entities.accounts[key]
        // originalのAccountを作ったhost
        const originalHost = data.url.match(HOST_REX)[1]
        const isOriginal = host === originalHost

        // acctにhost名が入ってない場合は補正する
        if(data.acct.indexOf('@') < 0)
          data.acct = `${data.acct}@${host}`

        data.id_by_host = new Map({[host]: data.id})
        delete data.id

        map[key] = new Account(data, {isOriginal})
        return map
      }, {}
    )
    entitiesByUrl.accounts = Object.values(entities.accounts).reduce(
      (map, obj) => {
        map[obj.uri] = obj
        return map
      }, {}
    )
  }

  if(entities.statuses) {
    entities.statuses = Object.keys(entities.statuses).reduce(
      (map, key) => {
        const data = entities.statuses[key]
        // originalのStatusを作ったhost
        const originalHost = data.url.match(HOST_REX)[1]
        const isOriginal = host === originalHost

        data.id_by_host = {[host]: data.id}
        delete data.id
        // reblog: null,
        data.in_reply_to_id_by_host = {[host]: data.in_reply_to_id}
        delete data.in_reply_to_id

        data.in_reply_to_account_id_by_host = {[host]: data.in_reply_to_account_id}
        delete data.in_reply_to_account_id

        const account = entities.accounts[data.account]
        data.account = account.uri

        if(data.reblog) {
          data.reblog = entities.statuses[data.reblog].uri
        }

        data.reblogged_by_acct = {[acct]: data.reblogged}
        delete data.reblogged
        data.favourited_by_acct = {[acct]: data.favourited}
        delete data.favourited

        // 自ホストのmentionのacctにinstance名が足りてないので細くする
        data.mentions = new List(data.mentions.map((mention) => {
          if(mention.acct.indexOf('@') >= 0)
            return mention
          return {...mention, acct: `${mention.acct}@${host}`}
        }))

        // attachments urlがHostによって違うので差分を吸収する
        data.media_attachments = data.media_attachments.map((attachment) => {
          attachment.id_by_host = new Map({[host]: attachment.id})
          delete attachment.id

          attachment.url_by_host = new Map({[host]: attachment.url})
          attachment.url = attachment.remote_url || attachment.url
          delete attachment.remote_url

          attachment.preview_url_by_host = new Map({[host]: attachment.preview_url})

          return attachment
        })

        map[key] = new Status(data, {isOriginal})
        return map
      }, {}
    )
    entitiesByUrl.statuses = Object.values(entities.statuses).reduce(
      (map, obj) => {
        map[obj.uri] = obj
        return map
      }, {}
    )
  }

  if(entities.notifications) {
    entities.notifications = Object.keys(entities.notifications).reduce(
      (map, key) => {
        const data = entities.notifications[key]

        data.host = host

        if(data.status) {
          const status = entities.statuses[data.status]
          data.status = status.uri
        }

        if(data.account) {
          const account = entities.accounts[data.account]
          data.account = account.uri
        }

        map[key] = new Notification(data)
        return map
      }, {}
    )
    entitiesByUrl.notifications = Object.values(entities.notifications).reduce(
      (map, obj) => {
        map[obj.uri] = obj
        return map
      }, {}
    )
  }

  if(entities.hashtags) {
    entitiesByUrl.hashtags = Object.values(Object.values(entities.hashtags)[0])
  }

  if(Array.isArray(result))
    result = result.map((key) => entities[entity[0].key][key].uri)
  else
    result = entities[entity.key][result].uri

  return {entities: entitiesByUrl, result, ...response}
}

export function normalizeStatus(...args) {
  return normalizeResponse(status, ...args)
}

export function normalizeNotification(...args) {
  return normalizeResponse(notification, ...args)
}


class MastodonAPISpec extends APISpec {
  /**
   * @override
   */
  normalize(req, response, result, options) {
    // linkヘッダに前後のURLが書いてある
    const rawLink = response.header['link']
    if(rawLink) {
      result.link = rawLink.split(',')
        .map((linktxt) => linktxt.match(/<([^>]*)>; rel="([^"]*)"/))
        .reduce((link, match) => {
          if(match) {
            link[match[2]] = match[1]
          }
          return link
        }, {})
    }

    const {entity} = this
    if(!entity)
      return result
    // methodがdeleteのときはレスポンスがnullだからconvertできない
    if (!result.result) {
      return null
    }

    if(['statuses'].indexOf(((Array.isArray(entity) && entity[0]) || entity).key) >= 0) {
      require('assert')(options.token, 'status.tokenが必要')
    }

    // reqからhostを得る
    const host = (new URL(req.prefix)).hostname
    const acct = options.token && options.token.acct
    return {...result, ...normalizeResponse(entity, result, host, acct)}
  }
}

// TODO: abc順にする
export default MastodonAPISpec.make({
  postApp: {
    endpoint: '/apps',
    method: 'post',
  },

  verifyCredentials: {
    endpoint: '/accounts/verify_credentials',
    entity: account,
    method: 'get',
  },

  updateCredentials: {
    endpoint: '/accounts/update_credentials',
    method: 'patch',
  },

  listPublicTimeline: {
    endpoint: '/timelines/public',
    entity: [status],
    method: 'get',
  },

  listHomeTimeline: {
    endpoint: '/timelines/home',
    entity: [status],
    method: 'get',
  },

  listHashtagTimeline: {
    endpoint: '/timelines/tag/:tag',
    entity: [status],
    method: 'get',
  },

  searchAccount: {
    endpoint: '/accounts/search',
    entity: [account],
    method: 'get',
  },

  postStatus: {
    endpoint: '/statuses',
    entity: status,
    method: 'post',
  },

  listFollowers: {
    endpoint: '/accounts/:id/followers',
    entity: [account],
    method: 'get',
  },

  listFollowings: {
    endpoint: '/accounts/:id/following',
    entity: [account],
    method: 'get',
  },

  listNotifications: {
    endpoint: '/notifications',
    entity: [notification],
    method: 'get',
  },

  listReports: {
    endpoint: '/reports',
    method: 'get',
  },

  listStatuses: {
    endpoint: '/accounts/:id/statuses',
    entity: [status],
    method: 'get',
  },

  favouriteStatus: {
    endpoint: '/statuses/:id/favourite',
    entity: status,
    method: 'post',
  },

  unfavouriteStatus: {
    endpoint: '/statuses/:id/unfavourite',
    entity: status,
    method: 'post',
  },

  reblogStatus: {
    endpoint: '/statuses/:id/reblog',
    entity: status,
    method: 'post',
  },

  unreblogStatus: {
    endpoint: '/statuses/:id/unreblog',
    entity: status,
    method: 'post',
  },

  createMedia: {
    endpoint: '/media',
    method: 'post',
    fields: ['file'],
  },

  getRelationships: {
    endpoint: '/accounts/relationships',
    method: 'get',
  },

  followAccount: {
    endpoint: '/accounts/:id/follow',
    method: 'post',
  },

  unfollowAccount: {
    endpoint: '/accounts/:id/unfollow',
    method: 'post',
  },

  followRemoteAccount: {
    endpoint: '/follows',
    entity: account,
    method: 'post',
  },

  listAccountStatuses: {
    endpoint: '/accounts/:id/statuses',
    entity: [status],
    method: 'get',
  },

  search: {
    endpoint: '/search',
    entity: result,
    method: 'get',
  },

  muteAccount: {
    endpoint: '/accounts/:id/mute',
    method: 'post',
  },

  unmuteAccount: {
    endpoint: '/accounts/:id/unmute',
    method: 'post',
  },

  blockAccount: {
    endpoint: '/accounts/:id/block',
    method: 'post',
  },

  unblockAccount: {
    endpoint: '/accounts/:id/unblock',
    method: 'post',
  },

  instance: {
    endpoint: '/instance',
    method: 'get',
  },
})
