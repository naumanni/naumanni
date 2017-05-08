import * as actions from 'src/actions'


export default class TokenState {
  /**
   * @param {OAuthToken[]} tokens
   */
  constructor(tokens=[]) {
    this.tokens = tokens
  }

  reduce(payload) {
    switch(payload.type) {
    case actions.TOKEN_LOADED:
      return this.onTokenLoaded(payload)
    case actions.TOKEN_ADDED:
      return this.onTokenAdded(payload)
    default:
      return this
    }
  }

  onTokenLoaded({tokens}) {
    return new TokenState(tokens)
  }

  onTokenAdded({token}) {
    return new TokenState([...this.tokens, token])
  }

  getTokenByAcct(acct) {
    return this.tokens.find((token) => token.acct === acct)
  }
}
