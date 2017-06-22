import {UseCase} from 'almin'
import {Request} from 'superagent'

import * as actions from 'src/actions'
import {makeOAuthAPIRequester} from 'src/api/APIRequester'
import MastodonAPISpec from 'src/api/MastodonAPISpec'
import {Instance, OAuthApp, OAuthToken} from 'src/models'
import Database from 'src/infra/Database'

/**
 * codeからアカウントを認証する
 */
export default class AuthorizeAccountUseCase extends UseCase {
  constructor() {
    super()
  }

  /**
   * @override
   * @param {string} host
   * @param {string} code
   * @param {string} redirectUri
   * @return {object} tokenとaccount
   */
  async execute(host, code, redirectUri) {
    let app
    try {
      app = await OAuthApp.query.getByIndex('host', host)
    } catch(e) {
      throw new Error('cannot find OAuthApp')
    }

    // code -> tokenにする
    const tokenData = (await new Request('POST', `https://${host}/oauth/token`)
      .set('Accept', 'application/json')
      .query({
        client_id: app.client_id,
        client_secret: app.client_secret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      })).body

    const token = new OAuthToken({
      host: host,
      ...tokenData,
    })
    Database.save(token)

    // TODO: LoadTokenUseCaseと被っているので合体させる
    // get my info
    const requester = makeOAuthAPIRequester(
      MastodonAPISpec, {
        token,
        endpoint: `https://${host}/api/v1`,
      })
    const {entities, result} = await requester.verifyCredentials()
    token.attachAccount(entities.accounts[result])

    // get instance information
    const instance = new Instance(
      token.host,
      (await requester.instance()).result
    )
    token.attachInstance(instance)

    // dispatch
    this.dispatch({
      type: actions.TOKEN_ADDED,
      token,
    })

    return {token, account: token.account}
  }
}
