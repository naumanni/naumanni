import {Account, Status} from 'src/models'

import APISpec from './APISpec'


export default APISpec.make({
  app: {
    endpoint: '/apps',
    // entity: OAuthApp,
    methods: 'post',
  },

  verifyCredentials: {
    endpoint: '/accounts/verify_credentials',
    entity: Account,
    methods: 'raw',
  },

  publicTimeline: {
    endpoint: '/timelines/public',
    entity: Status,
    methods: 'list',
  },
})
