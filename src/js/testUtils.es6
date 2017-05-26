/* eslint-disable */
import {config as openPGPConfig} from 'openpgp'


/**
 * (Nodeでの)テスト用にopenPGPにMockを仕込む。
 * beforeAll()で使えば良い
 */
export function initOpenPGPTest(global=window) {
  if(!global.crypto) {
    const crypto = require('crypto')

    global.crypto = {
      getRandomValues: function(buf) {
        let bytes = crypto.randomBytes(buf.length)
        buf.set(bytes)
      },
    }
  }
  openPGPConfig.aead_protect = true // activate fast AES-GCM mode (not yet OpenPGP standard)
}

const intlContext = {
  intl: {
    formatDate: jest.fn(),
    formatTime: jest.fn(),
    formatMessage: jest.fn(),
    formatRelative: jest.fn(),
    formatNumber: jest.fn(),
    formatPlural: jest.fn(),
    formatMessage: jest.fn(),
    formatHTMLMessage: jest.fn(),
    now: jest.fn(),
  },
}


export {intlContext}
