import {Account, OAuthToken} from 'src/models'
import PublicKeyCache, {StoredPublicKey} from 'src/infra/PublicKeyCache'
import {initOpenPGPTest} from 'src/testUtils'
import {MESSAGE_TAG_REX} from 'src/controllers/PGP'
import SendDirectMessageUseCase from '../SendDirectMessageUseCase'

const TEST_TEXT = '寿限無、寿限無 五劫の擦り切れ 海砂利水魚の水行末 雲来末 風来末 食う寝る処に住む処 藪ら柑子の藪柑子 パイポ　パイポ　パイポのシューリンガン シューリンガンのグーリンダイ グーリンダイのポンポコピーのポンポコナーの長久命の長助'
const TEST_KEYS = require('./test_keys.json')



beforeAll(() => {
  // init open pgp
  initOpenPGPTest()

  // set mock function to PublicKeyCache.fetchKeys
  PublicKeyCache.fetchKeys = async function(keyIds) {
    return keyIds.reduce((result, {keyId, user}) => {
      const keyArmored = TEST_KEYS.publicKeys[user]
      result.push(new StoredPublicKey({
        user,
        keyId,
        keyArmored,
      }))
      return result
    }, [])
  }
})


describe('SendDirectMessageUseCase', () => {
  it('can send encrypted messge', async () => {
    const mockToken = new OAuthToken({})
    const mockSelf = new Account({
      acct: 'alice@my.host',
      note: `PGP Key Fingerprint: 0001FFFF`,
    })
    const mockRecipient = new Account({
      acct: 'bob@my.host',
      note: `PGP Key Fingerprint: 0002FFFF`,
    })

    const mockPostStatus = jest.fn(() => {})

    mockToken._requester = {
      postStatus: mockPostStatus,
    }

    const usecase = new SendDirectMessageUseCase()

    await usecase.execute({
      token: mockToken,
      self: mockSelf,
      message: TEST_TEXT,
      recipients: [mockRecipient]
    })

    // このテスト文だと2回ぐらいコールされるはず
    expect(mockPostStatus.mock.calls.length).toBe(2)
    mockPostStatus.mock.calls.forEach(([{status, visibility}], idx) => {
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

    const mockToken = new OAuthToken({})
    const mockSelf = new Account({
      acct: 'alice@my.host',
      note: 'no public key!!',
    })
    const mockRecipient = new Account({
      acct: 'bob@my.host',
      note: 'no public key!!',
    })

    const mockPostStatus = jest.fn(() => {})

    mockToken._requester = {
      postStatus: mockPostStatus,
    }

    const usecase = new SendDirectMessageUseCase()

    await usecase.execute({
      token: mockToken,
      self: mockSelf,
      message: TEST_TEXT,
      recipients: [mockRecipient]
    })

    // このテスト文だと1回コールされるはず
    expect(mockPostStatus.mock.calls.length).toBe(1)

    const [[{status, visibility}]] = mockPostStatus.mock.calls

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
