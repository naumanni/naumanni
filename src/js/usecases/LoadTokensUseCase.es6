import {UseCase} from 'almin'

import {OAuthToken} from 'src/models'
import * as actions from 'src/actions'


export default class LoadTokensUseCase extends UseCase {
  constructor() {
    super()
  }

  async execute() {
    let tokens = await OAuthToken.query.getAll()

    tokens = await Promise.all(
      tokens.map(async (token) => {
        try {
          const {entities, result} = await token.requester.verifyCredentials()
          token.attachAccount(entities.accounts[result])
        } catch(e) {
          console.error(e)
        }
        return token
      })
    )

    this.dispatch({
      type: actions.TOKEN_LOADED,
      tokens,
    })
  }
}
