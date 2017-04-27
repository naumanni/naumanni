import * as actions from 'src/actions'


class TokenAndAccount {
  constructor(token, account) {
    this.token = token
    this.account = account
  }
}


export default class AccountsState {
  /**
   * @param {TokenAndAccount[]} tokensAndAccounts
   */
  constructor(tokensAndAccounts=[]) {
    this.tokensAndAccounts = tokensAndAccounts
  }

  reduce(payload) {
    switch(payload.type) {
    case actions.TOKEN_LOADED:
      return this.onTokenLoaded(payload)
    case actions.ACCOUNT_LOADED:
      return this.onAccountLoaded(payload)
    default:
      return this
    }
  }

  onTokenLoaded({tokens}) {
    const tokensAndAccounts = tokens.map((token) => {
      const old = this.tokensAndAccounts.find((ta) => ta.token.address === token.address)
      const account = old ? old.account : null
      return new TokenAndAccount(token, account)
    })
    return new AccountsState(tokensAndAccounts)
  }

  onAccountLoaded({token, account}) {
    const tokensAndAccounts = this.tokensAndAccounts.map((ta) => {
      if(ta.token.address === token.address)
        return new TokenAndAccount(ta.token, account)
      return ta
    })
    return new AccountsState(tokensAndAccounts)
  }

  getAccountByAddress(address) {
    return this.tokensAndAccounts.find((ta) => ta.account.address === address)
  }
}
