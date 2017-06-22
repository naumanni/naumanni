/* @flow */
import {UseCase} from 'almin'

import {Instance, OAuthToken} from 'src/models'
import * as actions from 'src/actions'


export default class LoadTokensUseCase extends UseCase {
  constructor() {
    super()
  }

  async execute() {
    let tokens = await OAuthToken.query.getAll()

    tokens = await Promise.all(
      tokens.map(this.verifyToken.bind(this))
    )

    this.dispatch({
      type: actions.TOKEN_LOADED,
      tokens,
    })
  }

  async verifyToken(token: OAuthToken) {
    const {requester} = token

    try {
      // verify credential
      const {entities, result} = await requester.verifyCredentials({})
      token.attachAccount(entities.accounts[result])
    } catch(e) {
      token.markFailed(true)
      console.error(`verifyTokenFailed Token(${token.accessToken}@${token.host}): ${e}`)
    }

    // get instance information
    const instance = new Instance(
      token.host,
      (await requester.instance()).result
    )
    token.attachInstance(instance)

    return token
  }
}
