import {UseCase} from 'almin'

import {OAuthToken} from 'src/models'
import * as actions from 'src/actions'

export default class UpdateTokensUseCase extends UseCase {
  constructor() {
    super()
  }

  async execute() {
    const tokens = await OAuthToken.query.getAll()

    this.dispatch({
      type: actions.TOKEN_LOADED,
      tokens,
    })

    for(const token of tokens) {
      const requester = token.requester
      let account
      try {
        account = await requester.verifyCredentials()
      } catch(e) {
        account = null
      }

      this.dispatch({
        type: actions.ACCOUNT_LOADED,
        token,
        account,
      })
    }
  }
}
