import {Account, Status} from 'src/models'

import APISpec from './APISpec'


export default APISpec.make({
  postApp: {
    endpoint: '/apps',
    methods: 'post',
  },

  verifyCredentials: {
    endpoint: '/accounts/verify_credentials',
    entity: Account,
    methods: 'get',
  },

  updateCredentials: {
    endpoint: '/accounts/update_credentials',
    methods: 'patch',
  },

  listPublicTimeline: {
    endpoint: '/timelines/public',
    entity: Status,
    methods: 'get',
  },
})
