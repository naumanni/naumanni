import React from 'react'
import {Request} from 'superagent'

import {makeOAuthAPIRequester} from 'src/api/APIRequester'
import MastodonAPISpec from 'src/api/MastodonAPISpec'
import {OAuthApp, OAuthToken} from 'src/models'
import Database from 'src/infra/Database'
import {parseQuery} from 'src/utils'

const ACCOUNT_REX = /^@([^@]+)@(.*)$/


export default class AuthorizePage extends React.Component {
  state = {
    error: null,
  }
  /**
   * @override
   */
  componentDidMount() {
    const query = parseQuery(this.props.location.search)
    const {code, host} = query

    authorize(host, code)
      .then((account) => {
        this.props.history.push('/')
      }, (error) => {
        this.setState({error: '' + error})
      })
  }

  /**
   * @override
   */
  render() {
    if(this.state.error) {
      return <div>Error: {this.state.error}</div>
    }
    return <div>authorizing...</div>
  }
}

async function authorize(host, code) {
  let app
  try {
    app = await OAuthApp.query.getByIndex('host', host)
  } catch(e) {
    throw new Error('cannot find OAuthApp')
  }

  // code -> tokenにする
  const redirectUri = `${location.origin}/authorize`
  const tokenData = (await new Request('POST', `https://${host}/oauth/token`)
    .set('Accept', 'application/json')
    .query({
      client_id: app.client_id,
      client_secret: app.client_secret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: `${redirectUri}?host=${host}`,
    })).body

  const token = new OAuthToken({
    host: host,
    ...tokenData,
  })
  Database.save(token)

  // get my info
  const requester = makeOAuthAPIRequester(
    MastodonAPISpec, {
      token,
      endpoint: `https://${host}/api/v1`,
      hooks: {
        response: (method, apiName, responseBody) => {
          return {host, ...responseBody}
        },
      },
    })
  const account = await requester.verifyCredentials()
  return account
}
