/* @flow */
import {fromJS, Map, Record} from 'immutable'

import type OAuthToken from 'src/models/OAuthToken'

import {
  STREAM_HOME, STREAM_LOCAL, STREAM_FEDERATION, STREAM_TAG,
} from 'src/constants'

type Url = string
type InstanceShape = {
  uri: string,
  title: string,
  description: string,
  email: string,
  version: string,
  urls: Map<string, string>
};


const URL_KEY_STREAMING_API = 'streaming_api'
const instanceDefaults: InstanceShape = {
  host: '',
  uri: '',
  title: '',
  description: '',
  email: '',
  version: '',
  urls: new Map(),
}

/**
 * Mastodon Instance Information
 * see https://github.com/tootsuite/documentation/blob/master/Using-the-API/API.md#instance
 */
export default class Instance extends Record(instanceDefaults) {  // eslint-disable-line new-cap
  /**
   * @constructor
   * @param {string} host
   * @param {any} raw
   */
  constructor(host: string, raw: {urls?: {[string]: string}}) {
    super({
      ...raw,
      host,
      urls: fromJS(raw.urls || {}),
    })
  }

  /**
   * WSSのURLを返す
   * @param {OAuthToken} token
   * @param {string} stream
   * @param {object} params
   * @return {Url}
   */
  makeStreamingAPIUrl(token: OAuthToken, stream: string, params?: any={}): Url {
    require('assert')(
      [STREAM_FEDERATION, STREAM_TAG, STREAM_LOCAL, STREAM_HOME].indexOf(stream) >= 0,
      'valid stream type'
    )

    let rootUrl = this.urls.get(URL_KEY_STREAMING_API)
    if(!rootUrl) {
      rootUrl = `wss://${token.host}`
    }

    const otherParams = Object.keys(params).length === 0
      ? ''
      : Object.keys(params)
          .reduce((prev, k, i) => (
            i === 0
              ? `&${k}=${encodeURIComponent(params[k])}`
              : `${prev}&${k}=${encodeURIComponent(params[k])}`
          ), '')

    return `${rootUrl}/api/v1/streaming/?access_token=${token.accessToken}&stream=${stream}${otherParams}`
  }
}
