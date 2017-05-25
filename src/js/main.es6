import {Context, Dispatcher} from 'almin'
import React from 'react'
import openpgp, {config as openPGPConfig} from 'openpgp'
import ReactDOM from 'react-dom'
import moment from 'moment'

import Application from './Application'
import AppStore from './store/AppStore'

import {NAUMANNI_VERSION} from 'src/constants'
import Dashboard from 'src/pages/Dashboard'


// initialize initial locale(==en)
moment.locale('en')
// react-intl内でenを読み込んでいるように見える...
// addLocaleData([...require('react-intl/locale-data/en')])


// install Raven @ production
if(process.env.NODE_ENV === 'production') {
  const Raven = require('raven-js')
  Raven
    .config('https://95c423d821584e798c480087ae77d823@sentry.io/166289', {
      release: NAUMANNI_VERSION,
    })
    .install()
}


async function main() {
  const dispatcher = new Dispatcher()
  const context = new Context({
    dispatcher,
    store: AppStore.create(),
  })
  Application.setup(context)

  if(process.env.NODE_ENV !== 'production') {
    // for development
    const AlminLogger = require('almin-logger')
    const logger = new AlminLogger()
    logger.startLogging(context)

    window.Perf = require('react-addons-perf')
  }

  // init open pgp
  openpgp.initWorker({
    path: '/static/openpgp.worker.js',
  })
  openPGPConfig.aead_protect = true // activate fast AES-GCM mode (not yet OpenPGP standard)

  ReactDOM.render(<Dashboard app={Application} />, document.getElementById('appContainer'))
}
main()


window.resetAll = () => {
  window.indexedDB.deleteDatabase('naummanni_database')
  localStorage.removeItem('naumanni::columns')
  history.replaceState('', null, '/')
  location.reload()
}
