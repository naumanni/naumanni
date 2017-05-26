import update from 'immutability-helper'

import * as actions from 'src/actions'

const DEFAULT_ACCT_SETTING = {
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
}


export default class PreferenceState {
  /**
   * @param {object} globals
   * @param {object} byAccts
   */
  constructor(globals={}, byAccts={}) {
    this._preferences = {
      globals: globals,
      byAccts: byAccts,
    }
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
    return this._preferences.globals
  }

  get byAccts() {
    return this._preferences.byAccts
  }

  byAcct(acct) {
    return this._preferences.byAccts[acct] || DEFAULT_ACCT_SETTING
  }

  onPrefecencesLoaded({globals, byAccts}) {
    globals = globals || {}
    byAccts = byAccts || {}

    // 初期値
    if(!globals.locale)
      globals.locale = window.navigator.language || 'en'

    return new PreferenceState(globals, byAccts)
  }

  onPrefecencesUpdated({globals, byAccts}) {
    return new PreferenceState(globals, byAccts)
  }

  onTokenLoaded({tokens}) {
    const {byAccts} = this
    const up = {}

    // add new acct
    for(const token of tokens) {
      if(token.acct && !byAccts[token.acct]) {
        up[token.acct] = {$set: DEFAULT_ACCT_SETTING}
      }
    }
    // remove old acct
    Object.keys(byAccts).forEach((acct) => {
      if(!tokens.find((t) => t.acct === acct)) {
        up[acct] = {$set: undefined}
      }
    })
    return new PreferenceState(
      this.globals, update(byAccts, up)
    )
  }

  onTokenAdded({token}) {
    return new PreferenceState(
      this.globals,
      update(this.byAccts, {[token.acct]: {$set: DEFAULT_ACCT_SETTING}})
    )
  }

  onTokenRemoved({token}) {
    return new PreferenceState(
      this.globals,
      update(this.byAccts, {[token.acct]: {$set: undefined}})
    )
  }
}
