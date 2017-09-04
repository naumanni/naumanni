import {Context, Dispatcher, StoreGroup} from 'almin'

import {MESSAGE_TAG_REX} from 'src/constants'
import {Account, OAuthToken} from 'src/models'
import PublicKeyCache, {StoredPublicKey} from 'src/infra/PublicKeyCache'
import {initOpenPGPTest} from 'src/testUtils'
import SendDirectMessageUseCase from '../SendDirectMessageUseCase'

const TEST_TEXT = '寿限無、寿限無 五劫の擦り切れ 海砂利水魚の水行末 雲来末 風来末 食う寝る処に住む処 藪ら柑子の藪柑子 パイポ　パイポ　パイポのシューリンガン シューリンガンのグーリンダイ グーリンダイのポンポコピーのポンポコナーの長久命の長助'
const TEST_KEYS = require('./test_keys.json')


jest.mock('src/infra/PublicKeyCache')
jest.mock('src/infra/TimelineData')


beforeAll(() => {
  // init open pgp
  initOpenPGPTest()
})


function makeDummyContext() {
  const dispatcher = new Dispatcher()
  const store = new StoreGroup([])

  return new Context({dispatcher, store})
}


describe('SendDirectMessageUseCase', () => {
  it('can send encrypted messge', async () => {
    PublicKeyCache.setDummyKeys(TEST_KEYS.publicKeys)

    const context = makeDummyContext()
    const mockToken = new OAuthToken({})
    const mockSelf = new Account({
      acct: 'alice@my.host',
      note: 'PGP Key Fingerprint: 0001FFFF',
      url: 'http://dummy/@alice',
    })
    const mockRecipient = new Account({
      acct: 'bob@my.host',
      note: 'PGP Key Fingerprint: 0002FFFF',
      url: 'http://dummy/@bob',
    })

    const mockPostStatus = require('src/infra/TimelineData').__postStatusManaged
    mockPostStatus.mockClear()

    await context.useCase(new SendDirectMessageUseCase())
      .execute({
        token: mockToken,
        self: mockSelf,
        message: TEST_TEXT,
        recipients: [mockRecipient],
        onSendDirectMessageComplete: jest.fn(),
      })

    // このテスト文だと2回ぐらいコールされるはず
    expect(mockPostStatus.mock.calls.length).toBe(2)
    mockPostStatus.mock.calls.forEach(([token, {message: {status, visibility}}], idx) => {
      // status must begin with recipient's account
      expect.assertions(status.indexOf('@bob') >= 0)
      // status must have NEM header
      const match = status.match(MESSAGE_TAG_REX)
      expect(match[2]).toBe('' + (idx + 1))
      expect(match[3]).toBe('2')
      // do not include any plain text
      expect(status.indexOf('寿限無') < 0)
      expect(status.indexOf('長助') < 0)
      // status must be `direct` visibility
      expect(visibility).toBe('direct')
    })
  })

  it('can send plain messge', async () => {
    require('assert')(TEST_TEXT.length < 500)
    PublicKeyCache.setDummyKeys({})

    const context = makeDummyContext()
    const mockToken = new OAuthToken({})
    const mockSelf = new Account({
      acct: 'alice@my.host',
      note: 'no public key!!',
      url: 'http://dummy/@alice',
    })
    const mockRecipient = new Account({
      acct: 'bob@my.host',
      note: 'no public key!!',
      url: 'http://dummy/@bob',
    })

    const mockPostStatus = require('src/infra/TimelineData').__postStatusManaged
    mockPostStatus.mockClear()

    await context.useCase(new SendDirectMessageUseCase())
      .execute({
        token: mockToken,
        self: mockSelf,
        message: TEST_TEXT,
        recipients: [mockRecipient],
        onSendDirectMessageComplete: jest.fn(),
      })

    // このテスト文だと1回コールされるはず
    expect(mockPostStatus.mock.calls.length).toBe(1)

    const [
      [token, {mediaFiles, message: {status, visibility}}],
    ] = mockPostStatus.mock.calls

    // status must begin with recipient's account
    expect.assertions(status.indexOf('@bob') >= 0)
    // status must not have NEM header
    const match = status.match(MESSAGE_TAG_REX)
    expect(match).toBeNull()
    // do not include any plain text
    expect(status.indexOf('寿限無') >= 0)
    expect(status.indexOf('長助') >= 0)
    // status must be `direct` visibility
    expect(visibility).toBe('direct')
  })
})
