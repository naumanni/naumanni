import {STREAM_HOME} from 'src/constants'
import {makeWebsocketUrl} from '../misc'

describe('makeWebsocketUrl', () => {
  const token = {
    host: 'oppai.tokyo',
    accessToken: 'abracadabra',
  }
  const stream = 'user'

  describe('params', () => {
    let params

    it('can encode multiple parameters', () => {
      params = {
        spam: 'spam',
        ham: 'ham',
      }
      const wsUrl = makeWebsocketUrl(token, stream, params)
      expect(wsUrl).toBe('wss://oppai.tokyo/api/v1/streaming/?access_token=abracadabra&stream=user&spam=spam&ham=ham')
    })
    it('can encode multibyte characters', () => {
      params = {
        spam: 'スパム',
      }
      const wsUrl = makeWebsocketUrl(token, stream, params)
      expect(wsUrl).toBe('wss://oppai.tokyo/api/v1/streaming/?access_token=abracadabra&stream=user&spam=%E3%82%B9%E3%83%91%E3%83%A0')
    })
  })
})
