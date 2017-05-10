import {normalize, schema} from 'normalizr'

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


export function normalizeResponse(entity, responseBody, host, acct=null) {
  let {entities, result} = normalize(responseBody, entity)
  let entitiesByUrl = {}

  // TODO:normalizしているコードをModelの方に移す
  if(entities.accounts) {
    entities.accounts = Object.keys(entities.accounts).reduce(
      (map, key) => {
        const data = entities.accounts[key]

        // acctにhost名が入ってない場合は補正する
        if(data.acct.indexOf('@') < 0)
          data.acct = `${data.acct}@${host}`

        data.id_by_host = {[host]: data.id}
        delete data.id

        map[key] = new Account(data)
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

        data.mentions_by_host = {[host]: data.mentions}
        delete data.mentions

        map[key] = new Status(data)
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

  if(Array.isArray(result))
    result = result.map((key) => entities[entity[0].key][key].uri)
  else
    result = entities[entity.key][result].uri

  return {entities: entitiesByUrl, result}
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
  normalize(req, responseBody, options) {
    const {entity} = this
    if(!entity)
      return responseBody
    // methodがdeleteのときはレスポンスがnullだからconvertできない
    if (!responseBody) {
      return null
    }

    if(((Array.isArray(entity) && entity[0]) || entity).key === 'statuses') {
      require('assert')(options.token, 'statusの整形にはoptions.tokenが必要')
    }

    // reqからhostを得る
    const host = (new URL(req.url)).hostname
    const acct = options.token && options.token.acct
    return normalizeResponse(entity, responseBody, host, acct)
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
})
