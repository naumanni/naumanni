import * as actions from 'src/actions'


export default class TokenState {
  /**
   * @param {OAuthToken[]} tokens
   */
  constructor(tokens=[]) {
    this.tokens = tokens
    this.tokens.sort((a, b) => {
      if(a.acct > b.acct)
        return 1
      else if(a.acct < b.acct)
        return -1
      return 0
    })
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
