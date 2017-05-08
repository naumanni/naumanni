import openpgp, {message as openpgpMessage} from 'openpgp'
import base65536 from 'base65536'
import CRC32 from 'crc-32'  // OpenPGPのCRC24使いたい...

import {MESSAGE_TAG_REX} from 'src/constants'


// [N]aummanni [E]ncrypted [M]essage
const MESSAGE_TAG_LENGTH = '--NEM.ffffffff.00/00--\n'.length

/**
 * contentを与えられたaddressesとsenderPublicKeyで暗号化する。maxLengthごとにBlockに分割される
 * @params {String} content 暗号化したい平文
 * @params {Object<String, Key>} addresses 送信先のアドレスと、KeyのMap
 * @params {Key} senderPublicKey 自分の公開鍵。無いと自分で読めない
 * @params {Int} maxLength ブロック最大長
 * @return {String[]} ブロックに別れた暗号化済みのテキスト
 */
export async function encryptText({content, addresses, senderPublicKey, maxLength}) {
  require('assert')(typeof content === 'string' && content.length > 0)

  const publicKeys = Object.values(addresses)
  publicKeys.push(senderPublicKey)

  const ciphertext = await openpgp.encrypt({
    data: content,
    publicKeys,
    filename: '',
    armor: false,
    detached: true,
  })

  const prefix = Object.keys(addresses).map((acct) => `@${acct}`).join(' ') + ' '

  // preferredBlockSizeでBlockを分割して出力
  const preferredBlockSize = maxLength - prefix.length - MESSAGE_TAG_LENGTH
  if(preferredBlockSize < 0)
    throw new Error('cannot split encoded to blocks.')
  const data = ciphertext.message.packets.write()
  const blocks = splitDataWithBase65536(data, preferredBlockSize)

  // TODO:blocksが3桁ぐらい行くことを想定していない...
  return blocks.map((encoded, idx) => {
    return `${prefix}--NEM.${getCheckSum(data)}.${idx + 1}/${blocks.length}--\n${encoded}`
  })
}


export async function decryptBlocks(encodedBlocks, privateKey) {
  let checksumGiven = null
  let blocks = new Array(encodedBlocks.length)
  let size = 0

  // blockのchecksumを調べつつ、sort
  for(const block of encodedBlocks) {
    const match = block.match(MESSAGE_TAG_REX)
    if(!match) {
      throw new Error('Invalid message block.')
    }
    const c = match[1].toLowerCase()
    const idx = parseInt(match[2], 10)
    const total = parseInt(match[3], 10)

    if(!checksumGiven) {
      checksumGiven = c
    } else if(checksumGiven != c) {
      throw new Error('Invalid block checksum.')
    }

    if(total != encodedBlocks.length) {
      throw new Error('Insufficient number of blocks.')
    }
    if(idx < 0) {
      throw new Error('Invalid block index.')
    }
    if(blocks[idx - 1]) {
      throw new Error('Duplicated index of blocks.')
    }

    const encoded = block.substr(match.index + match[0].length + 1)
    const decoded = base65536.decode(encoded)
    blocks[idx - 1] = decoded
    size += decoded.length
  }

  const concatenated = new Uint8Array(size)
  blocks.reduce((pos, decoded) => {
    concatenated.set(new Uint8Array(decoded), pos)
    return pos + decoded.length
  }, 0)


  if(checksumGiven !== getCheckSum(concatenated)) {
    throw new Error('Message checksum does not matched.')
  }
  const message = openpgpMessage.read(concatenated)
  const decrypted = await openpgp.decrypt({
    message,
    privateKey,
  })

  return decrypted.data
}


/**
 * dataをbase65536後にpreferredBlockSize未満にFitするように分割する。
 * base65536後のサイズがよくわからんので、気合
 * @param {UInt8Array} data
 * @param {Int} preferredBlockSize
 * @param {String[]} array
 * @return {String[]} コード済ブロック
 */
function splitDataWithBase65536(data, preferredBlockSize) {
  const blocks = []

  for(let pos=0; pos < data.length;) {
    let blockSize = Math.floor(preferredBlockSize / 0.8)
    let encoded
    let blockData

    // fit encoded block size to preferredBlockSize
    for(;;) {
      blockData = data.subarray(pos, pos + blockSize)
      encoded = base65536.encode(blockData)

      let delta

      // ブロックサイズの8バイト以内だったら終わり
      if(preferredBlockSize - 8 <= encoded.length && encoded.length <= preferredBlockSize) {
        break
      } else if(encoded.length < preferredBlockSize) {
        if(pos + blockSize >= data.length) {
          // 末尾.split終了
          break
        }
        // ブロックより小さければ、ちょっと大きくする
        delta = Math.max(preferredBlockSize - encoded.length, 4)
      } else {
        // ブロックよりでかければ、ちょっと小さくする
        delta = Math.min(preferredBlockSize - encoded.length, -4)
      }
      blockSize += delta
    }

    blocks.push(encoded)
    pos += blockSize
  }
  return blocks
}


function getCheckSum(data) {
  const c = CRC32.buf(data)
  const bytes = new Uint8Array([c >> 24, (c >> 16) & 0xFF, (c >> 8) & 0xFF, c & 0xFF])
  // TODO: Bufferってなんだ?
  return Buffer.from(bytes).toString('hex')
}
