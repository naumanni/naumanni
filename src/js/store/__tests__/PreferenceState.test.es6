import PreferenceState from '../PreferenceState'

import * as actions from 'src/actions'


describe('PreferenceState', () => {
  it('can reduce by PREFERENCES_LOADED', () => {
    let state

    state = new PreferenceState({}, {})
    expect(state.globals.size).toBe(0)
    expect(state.byAccts.size).toBe(0)

    state = state.reduce({
      type: actions.PREFERENCES_LOADED,
      preferences: {
        byAccts: {
          'shn@oppai.tokyo': {
            notifications: {
              mention: {
                audio: false
              }
            }
          }
        }
      }
    })
    expect(state.byAccts.size).toBe(1)
    let pref = state.byAcct('shn@oppai.tokyo')
    expect(pref).not.toBeNull()
    expect(pref.get('notifications').get('mention').get('audio')).toBe(false)
    expect(pref.get('notifications').get('mention').get('desktop')).toBe(true)
    expect(pref.get('notifications').get('reblog').get('audio')).toBe(true)
    expect(pref.get('notifications').get('reblog').get('desktop')).toBe(true)
  })

  it('can reduce by TOKEN_LOADED', () => {
    let state = new PreferenceState({}, {
      'ghi@example.net': {}
    })

    state = state.reduce({type: actions.TOKEN_LOADED, tokens: [
      {acct: 'abc@example.com'},
      {acct: 'def@example.org'},
    ]})
    expect(state.byAccts.size).toBe(2)
    let pref = state.byAcct('abc@example.com')
    expect(pref.get('notifications').get('mention').get('audio')).toBe(true)
    pref = state.byAcct('def@example.com')
    expect(pref.get('notifications').get('mention').get('audio')).toBe(true)
    pref = state.byAcct('ghi@example.net')
    // expect(pref).toBeNull()  デフォルト値がとれるのでテストしない
  })
})
