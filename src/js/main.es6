import {Context, Dispatcher} from 'almin'
import React from 'react'
import openpgp, {config as openPGPConfig} from 'openpgp'
import ReactDOM from 'react-dom'
import moment from 'moment'

import Application from './Application'
import AppStore from './store/AppStore'

import Dashboard from 'src/pages/Dashboard'
import BrowserHistory from 'src/controllers/BrowserHistory'
import installRoutes from './routes'


// moment.locale(window.navigator.language)
moment.locale('ja')


// install Raven @ production
if(process.env.NODE_ENV === 'production') {
  const Raven = require('raven-js')
  Raven
      .config('https://95c423d821584e798c480087ae77d823@sentry.io/166289')
      .install()
}


async function main() {
  const dispatcher = new Dispatcher()
  const context = new Context({
    dispatcher,
    store: AppStore.create(),
  })
  Application.context = context
  Application.history = new BrowserHistory(context, false /* useHash */)

  installRoutes(Application.history)

  if(process.env.NODE_ENV !== 'production') {
    const AlminLogger = require('almin-logger')
    const logger = new AlminLogger()
    logger.startLogging(context)
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
