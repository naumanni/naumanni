import {Account, Status} from 'src/models'

import APISpec from './APISpec'


// TODO: normalizrを使う

export default APISpec.make({
  postApp: {
    endpoint: '/apps',
    method: 'post',
  },

  verifyCredentials: {
    endpoint: '/accounts/verify_credentials',
    entity: Account,
    method: 'get',
  },

  updateCredentials: {
    endpoint: '/accounts/update_credentials',
    method: 'patch',
  },

  listPublicTimeline: {
    endpoint: '/timelines/public',
    entity: Status,
    method: 'get',
  },

  searchAccount: {
    endpoint: '/search',
    method: 'get',
  },

  postStatus: {
    endpoint: '/statuses',
    entity: Status,
    method: 'post',
  },
})
