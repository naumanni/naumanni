const DEFAULT_CONFIG = {
  WELCOME_DIALOG: null,
}

const config = (function() {
  let userConfig
  try {
    userConfig = require('naumanniConfig').default
  } catch(e) {
    // pass
  }

  return Object.freeze({
    ...DEFAULT_CONFIG,
    ...(userConfig || {}),
  })
})()
export default config
