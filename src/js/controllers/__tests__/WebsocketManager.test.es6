import {Server} from 'mock-socket'

import WebsocketManager from '../WebsocketManager'

const TEST_WEBSOCKET_HOST = 'ws://localhost:4545'


describe('WebsocketManager', () => {
  it('can listen websocket', (done) => {
    const mockServer = new Server(TEST_WEBSOCKET_HOST)

    mockServer.on('connection', (server) => {
      server.send(`{"event":"update","payload":"{\\"id\\":8053,\\"created_at\\":\\"2017-05-04T17:34:46.761Z\\",\\"in_reply_to_id\\":null,\\"in_reply_to_account_id\\":null,\\"sensitive\\":null,\\"spoiler_text\\":\\"\\",\\"visibility\\":\\"direct\\",\\"application\\":{\\"name\\":\\"naumanniskine\\",\\"website\\":null},\\"account\\":{\\"id\\":1,\\"username\\":\\"shn\\",\\"acct\\":\\"shn\\",\\"display_name\\":\\"shn@oppai.tokyo✅\\",\\"locked\\":false,\\"created_at\\":\\"2017-04-19T05:54:24.431Z\\",\\"followers_count\\":62,\\"following_count\\":22,\\"statuses_count\\":95,\\"note\\":\\"ぶっちゃけ最近は尻も好きです\\\\nPGP Key Fingerprint: c3760e259ed09aae51d7d85e893ab07b862199c1\\",\\"url\\":\\"https://oppai.tokyo/@shn\\",\\"avatar\\":\\"https://ot-mastodon.s3.amazonaws.com/accounts/avatars/000/000/001/original/2408e330e310f168.png?1492583237\\",\\"avatar_static\\":\\"https://ot-mastodon.s3.amazonaws.com/accounts/avatars/000/000/001/original/2408e330e310f168.png?1492583237\\",\\"header\\":\\"/headers/original/missing.png\\",\\"header_static\\":\\"/headers/original/missing.png\\"},\\"media_attachments\\":[],\\"mentions\\":[{\\"url\\":\\"https://mstdn.onosendai.jp/@shn\\",\\"acct\\":\\"shn@mstdn.onosendai.jp\\",\\"id\\":134,\\"username\\":\\"shn\\"}],\\"tags\\":[],\\"uri\\":\\"tag:oppai.tokyo,2017-05-04:objectId=8053:objectType=Status\\",\\"content\\":\\"<p><span class=\\\\\\"h-card\\\\\\"><a href=\\\\\\"https://mstdn.onosendai.jp/@shn\\\\\\" class=\\\\\\"u-url mention\\\\\\">@<span>shn</span></a></span> mogemoge</p>\\",\\"url\\":\\"https://oppai.tokyo/@shn/8053\\",\\"reblogs_count\\":0,\\"favourites_count\\":0,\\"reblog\\":null,\\"favourited\\":false,\\"reblogged\\":false}"}`)
      server.send(`{"event":"update","payload":"{\\"id\\":8053,\\"created_at\\":\\"2017-05-04T17:34:46.761Z\\",\\"in_reply_to_id\\":null,\\"in_reply_to_account_id\\":null,\\"sensitive\\":null,\\"spoiler_text\\":\\"\\",\\"visibility\\":\\"direct\\",\\"application\\":{\\"name\\":\\"naumanniskine\\",\\"website\\":null},\\"account\\":{\\"id\\":1,\\"username\\":\\"shn\\",\\"acct\\":\\"shn\\",\\"display_name\\":\\"shn@oppai.tokyo✅\\",\\"locked\\":false,\\"created_at\\":\\"2017-04-19T05:54:24.431Z\\",\\"followers_count\\":62,\\"following_count\\":22,\\"statuses_count\\":95,\\"note\\":\\"ぶっちゃけ最近は尻も好きです\\\\nPGP Key Fingerprint: c3760e259ed09aae51d7d85e893ab07b862199c1\\",\\"url\\":\\"https://oppai.tokyo/@shn\\",\\"avatar\\":\\"https://ot-mastodon.s3.amazonaws.com/accounts/avatars/000/000/001/original/2408e330e310f168.png?1492583237\\",\\"avatar_static\\":\\"https://ot-mastodon.s3.amazonaws.com/accounts/avatars/000/000/001/original/2408e330e310f168.png?1492583237\\",\\"header\\":\\"/headers/original/missing.png\\",\\"header_static\\":\\"/headers/original/missing.png\\"},\\"media_attachments\\":[],\\"mentions\\":[{\\"url\\":\\"https://mstdn.onosendai.jp/@shn\\",\\"acct\\":\\"shn@mstdn.onosendai.jp\\",\\"id\\":134,\\"username\\":\\"shn\\"}],\\"tags\\":[],\\"uri\\":\\"tag:oppai.tokyo,2017-05-04:objectId=8053:objectType=Status\\",\\"content\\":\\"<p><span class=\\\\\\"h-card\\\\\\"><a href=\\\\\\"https://mstdn.onosendai.jp/@shn\\\\\\" class=\\\\\\"u-url mention\\\\\\">@<span>shn</span></a></span> mogemoge</p>\\",\\"url\\":\\"https://oppai.tokyo/@shn/8053\\",\\"reblogs_count\\":0,\\"favourites_count\\":0,\\"reblog\\":null,\\"favourited\\":false,\\"reblogged\\":false}"}`)
    })

    let count = 0
    const remover = WebsocketManager.listen(
      TEST_WEBSOCKET_HOST, ({connection, type, payload, source}) => {
        count += 1
      }
    )

    const timerId = setInterval(() => {
      if(count >= 2) {
        clearInterval(timerId)
        mockServer.stop(done)
      }
    }, 100)
  })

  // it('can reconnect after disconnect', () => {

  // })
})
