import {UseCase} from 'almin'

import * as actions from 'src/actions'
import Database from 'src/infra/Database'


export default class DeleteTokenUseCase extends UseCase {
  constructor() {
    super()
  }

  /**
   * @param {OAuthToken} token
   */
  async execute(token) {
    Database.del(token)

    this.dispatch({
      type: actions.TOKEN_DELETED,
      token,
    })
  }
}
