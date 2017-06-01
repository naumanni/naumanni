import {fromJS, Map} from 'immutable'

import * as actions from 'src/actions'

const DEFAULT_GLOBALS = fromJS({
  locale: null,
})

const DEFAULT_ACCT_SETTING = fromJS({
  notifications: {
    mention: {
      audio: true,
      desktop: true,
    },
    reblog: {
      audio: true,
      desktop: true,
    },
    favourite: {
      audio: true,
      desktop: true,
    },
    follow: {
      audio: true,
      desktop: true,
    },
  },
})


export default class PreferenceState {
  /**
   * @param {object} globals
   * @param {object} byAccts
   */
  constructor(globals, byAccts) {
    this._preferences = new Map({
      globals: fromJS(globals),
      byAccts: fromJS(byAccts),
    })
  }

  reduce(payload) {
    switch(payload.type) {
    case actions.PREFERENCES_LOADED:
      return this.onPrefecencesLoaded(payload.preferences)
    case actions.PREFERENCES_UPDATED:
      return this.onPrefecencesUpdated(payload.preferences)
    case actions.TOKEN_LOADED:
      return this.onTokenLoaded(payload)
    case actions.TOKEN_ADDED:
      return this.onTokenAdded(payload)
    case actions.TOKEN_REMOVED:
      return this.onTokenRemoved(payload)
    default:
      return this
    }
  }

  get globals() {
    return this._preferences.get('globals')
  }

  get byAccts() {
    return this._preferences.get('byAccts')
  }

  byAcct(acct) {
    return this.byAccts.get(acct) || DEFAULT_ACCT_SETTING
  }

  onPrefecencesLoaded({globals, byAccts}) {
    globals = DEFAULT_GLOBALS.mergeDeep(DEFAULT_GLOBALS, globals)
    byAccts = new Map(Object.keys(byAccts).map((acct) => {
      const acctPref = fromJS(byAccts[acct])
      return [acct, DEFAULT_ACCT_SETTING.mergeDeep(acctPref)]
    }))

    // 初期値
    if(!globals.get('locale'))
      globals = globals.set('locale', window.navigator.language || 'en')

    return new PreferenceState(globals, byAccts)
  }

  onPrefecencesUpdated({globals, byAccts}) {
    return new PreferenceState(globals, byAccts)
  }

  onTokenLoaded({tokens}) {
    let byAccts = this.byAccts.withMutations((byAccts) => {
      // add new acct
      for(const token of tokens) {
        if(token.acct && !byAccts.has(token.acct))
          byAccts.set(token.acct, DEFAULT_ACCT_SETTING)
      }

      // remove old acct
      for(const acct of byAccts.keys()) {
        if(!tokens.find((t) => t.acct === acct))
          byAccts.delete(acct)
      }
    })

    return new PreferenceState(this.globals, byAccts)
  }

  onTokenAdded({token}) {
    return new PreferenceState(
      this.globals,
      this.byAccts.set(token.acct, DEFAULT_ACCT_SETTING)
    )
  }

  onTokenRemoved({token}) {
    return new PreferenceState(
      this.globals,
      this.byAccts.delete(token.acct)
    )
  }
}
