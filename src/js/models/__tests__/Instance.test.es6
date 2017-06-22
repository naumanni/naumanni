import {STREAM_HOME} from 'src/constants'
import Instance from '../Instance'
import OAuthToken from '../OAuthToken'


describe('Instance', () => {
  const token = new OAuthToken({
    host: 'oppai.tokyo',
    access_token: 'abracadabra',
  })
  const instance = new Instance(token.host, {})
  const stream = 'user'

  describe('makeStreamingAPIUrl', () => {
    let params

    it('can encode multiple parameters', () => {
      params = {
        spam: 'spam',
        ham: 'ham',
      }
      const wsUrl = instance.makeStreamingAPIUrl(token, stream, params)
      expect(wsUrl).toBe('wss://oppai.tokyo/api/v1/streaming/?access_token=abracadabra&stream=user&spam=spam&ham=ham')
    })
    it('can encode multibyte characters', () => {
      params = {
        spam: 'スパム',
      }
      const wsUrl = instance.makeStreamingAPIUrl(token, stream, params)
      expect(wsUrl).toBe('wss://oppai.tokyo/api/v1/streaming/?access_token=abracadabra&stream=user&spam=%E3%82%B9%E3%83%91%E3%83%A0')
    })
  })
})
