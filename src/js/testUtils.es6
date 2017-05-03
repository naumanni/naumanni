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
        var bytes = crypto.randomBytes(buf.length);
        buf.set(bytes);
      }
    }
  }
  openPGPConfig.aead_protect = true // activate fast AES-GCM mode (not yet OpenPGP standard)
}
