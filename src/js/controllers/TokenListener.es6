import {
  SUBJECT_MIXED,
} from 'src/constants'
import ChangeEventEmitter from 'src/utils/EventEmitter'


export default class TokenListener extends ChangeEventEmitter {
  constructor(subject, options={}) {
    super()

    this.subject = subject
    this._tokens = {}
    this.options = options
  }

  updateTokens(tokens) {
    if(this.subject !== SUBJECT_MIXED) {
      // Accountタイムラインなので、一致するアカウントのみ
      tokens = tokens.filter((token) => token.acct === this.subject)
    }
    tokens = tokens.reduce((map, token) => {
      map[token.acct] = token
      return map
    }, {})

    // new tokens
    Object.values(tokens)
      .filter((newToken) => !this._tokens[newToken.acct] || !this._tokens[newToken.acct].isEqual(newToken))
      .forEach((token) => {
        const oldToken = this._tokens[token.acct]
        if(oldToken) {
          // token updated
          if(oldToken.accessToken != token.accessToken)
            this.onTokenUpdated(token, oldToken)
        } else {
          // token added
          this.onTokenAdded(token)
        }
      })

    // disposed tokens
    Object.values(this._tokens)
      .filter((oldToken) => !tokens[oldToken.acct] || !tokens[oldToken.acct].isEqual(oldToken))
      .forEach((token) => {
        if(!tokens[token.acct]) {
          // token removed
          console.log(`token removed ${token.toString()}`)
          this.onTokenRemoved(token)
        }
      })

    this._tokens = tokens
  }

  getSubjectToken() {
    if(this.subject === SUBJECT_MIXED)
      return null
    return this._tokens[this.subject]
  }

  getTokens() {
    return Array.from(Object.values(this._tokens))
  }

  onTokenAdded(newToken) {
    this.options.onTokenAdded && this.options.onTokenAdded(newToken)
  }

  onTokenRemoved(oldToken) {
    this.options.onTokenAdded && this.options.onTokenRemoved(oldToken)
  }

  onTokenUpdated(newToken, oldToken) {
    this.options.onTokenAdded && this.options.onTokenUpdated(newToken, oldToken)
  }
}
