import {List} from 'immutable'

import * as actions from 'src/actions'


export default class TokenState {
  /**
   * @param {OAuthToken[]} tokens
   */
  constructor(tokens=[]) {
    tokens = [...tokens]
    tokens.sort((a, b) => {
      if(a.acct > b.acct)
        return 1
      else if(a.acct < b.acct)
        return -1
      return 0
    })

    this._tokens = new List(tokens)
  }

  reduce(payload) {
    switch(payload.type) {
    case actions.TOKEN_LOADED:
      return this.onTokenLoaded(payload)
    case actions.TOKEN_ADDED:
      return this.onTokenAdded(payload)
    case actions.TOKEN_DELETED:
      return this.onTokenDeleted(payload)
    default:
      return this
    }
  }

  onTokenLoaded({tokens}) {
    return new TokenState(tokens)
  }

  onTokenAdded({token}) {
    return new TokenState([...this._tokens, token])
  }

  onTokenDeleted({token}) {
    return new TokenState(this._tokens.filter((t) => !t.isEqual(token)))
  }

  getTokenByAcct(acct) {
    return this.tokens.find((token) => token.acct === acct)
  }

  /**
   * 生きている、読み込みが完了しているTokenのみリストする
   */
  get tokens() {
    return this._tokens.filter((token) => token.isAlive())
  }

  /**
   * 全てのTokenを返す。
   */
  get allTokens() {
    return this._tokens
  }
}
