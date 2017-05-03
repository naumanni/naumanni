import {initOpenPGPTest} from '../testUtils'


describe('initOpenPGPTest()', () => {
  it('could set crypto if not present', () => {
    const g = {}
    initOpenPGPTest(g)
    expect(g.crypto).not.toBeNull()
  })

  it('could not set crypto if alredy presented', () => {
    const defaultCrypto = new Object()
    const g = {crypto: defaultCrypto}
    initOpenPGPTest(g)
    expect(g.crypto).toBe(defaultCrypto)
  })
})
