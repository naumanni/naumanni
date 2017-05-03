import {key as openpgpKey} from 'openpgp'

import {initOpenPGPTest} from 'src/testUtils'
import {encryptText, decryptBlocks} from '../PGP'

const KEYS = require('./PGP.test.fixtures.json')


// const TEST_TEXT = 'The quick brown fox jumps over the lazy dog. 1234567890'
const TEST_TEXT = '寿限無、寿限無 五劫の擦り切れ 海砂利水魚の水行末 雲来末 風来末 食う寝る処に住む処 藪ら柑子の藪柑子 パイポ　パイポ　パイポのシューリンガン シューリンガンのグーリンダイ グーリンダイのポンポコピーのポンポコナーの長久命の長助'


beforeAll(() => {
  initOpenPGPTest()
})


test('PGP can encrypt/decrypt message', async () => {
  // encrypt test
  const pubkeySender = openpgpKey.readArmored(KEYS.sender.public).keys[0]
  const pubkeyReceiver = openpgpKey.readArmored(KEYS.receiver.public).keys[0]

  const encryptedBlocks = await encryptText({
    content: TEST_TEXT,
    addresses: {
      'receiver@example.com': pubkeyReceiver,
    },
    senderPublicKey: pubkeySender,
    maxLength: 500,
  })
  expect(encryptedBlocks).not.toBeNull()
  expect(encryptedBlocks).toHaveLength(2)  // 2048bitのkey2個なので、たかだか2blockでしょ
  for(const block of encryptedBlocks) {
    expect(block).not.toBeNull()
    expect.assertions(block.startsWith('---BEM'))
  }

  // decrypt with sender's private key
  const prvkeySender = openpgpKey.readArmored(KEYS.sender.private).keys[0]

  let decryptedText = await decryptBlocks(encryptedBlocks, prvkeySender)
  expect(decryptedText).toBe(TEST_TEXT)
})
