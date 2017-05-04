import {OAuthToken, Account} from 'src/models'
import TalkListener from '../TalkListener'

jest.mock('src/api/APIRequester')


beforeAll(() => {
  process.removeAllListeners('unhandledRejection')
  process.on('unhandledRejection', console.dir);
})


describe('TalkListener', () => {
  it('can fetch talks', async () => {
    const mockToken = new OAuthToken({})
    const mockSelf = new Account({
      id: 1,
      acct: 'shn@oppai.tokyo',
      note: `PGP Key Fingerprint: 0001FFFF`,
    })
    const mockRecipient = 'shn@mstdn.onosendai.jp'
    require('src/api/APIRequester').__setScenario(require('./TalkListener.scenario.json'))

    let lastChanged = undefined
    let lastState = undefined

    //
    const listener = new TalkListener([mockRecipient])
    listener.onChange((l) => {
      lastChanged = new Date()
      lastState = {...l}
    })

    const waitChange = async () => {
      const saved = lastChanged

      return new Promise((resolve) => {
        const waiter = () => {
          if(lastChanged != saved)
            resolve(lastState)
          else
          setTimeout(waiter)
        }
        setTimeout(waiter)
      })
    }

    listener.updateTokenAndAccount({token: mockToken, account: mockSelf})

    // accountsをとってくると、一旦changeが来る
    let state
    state = await waitChange()
    expect(state.members[mockRecipient]).not.toBeNull()

    // その後Talkがどんどん来るはず...
    for(;;) {
      state = await waitChange()
      if(listener.isWatching())
        break
    }
    expect(state.talk.length).toBeGreaterThan(0)
  })
})


function waitChange(listener) {
  return new Promise((resolve, reject) => {
    const remover = listener.onChange((l) => {
      resolve(l)
      remover()
    })
  })
}
