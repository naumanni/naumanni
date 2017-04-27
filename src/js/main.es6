import {Context, Dispatcher} from 'almin'
import React from 'react'
import openpgp, {config as openPGPConfig} from 'openpgp'
import ReactDOM from 'react-dom'
// import PropTypes from 'prop-types'
// import {BrowserRouter as Router, Route, Switch} from 'react-router-dom'

import Application from './Application'
import AppStore from './store/AppStore'

import Dashboard from 'src/pages/Dashboard'


async function main() {
  const dispatcher = new Dispatcher()
  const context = new Context({
    dispatcher,
    store: AppStore.create(),
  })
  Application.context = context

  if(process.env.NODE_ENV !== 'production') {
    const AlminLogger = require('almin-logger')
    const logger = new AlminLogger()
    logger.startLogging(context)
  }

  ReactDOM.render(<Dashboard app={Application} />, document.getElementById('appContainer'))

  // init open pgp
  openpgp.initWorker({
    path: '/static/openpgp.worker.js',
  })
  openPGPConfig.aead_protect = true // activate fast AES-GCM mode (not yet OpenPGP standard)

  // class RootElement extends React.Component {
  //   static get childContextTypes() {
  //     return {context: PropTypes.any}
  //   }

  //   getChildContext() {
  //     return {context}
  //   }

  //   render() {
  //     return this.props.children
  //   }
  // }

  // ReactDOM.render(
  //   <RootElement>
  //     <Router>
  //       <div className="appContainer">
  //         <Switch>
  //           <Route exact path="/" component={require('./pages/AccountsPage.es6').default} />
  //           <Route exact path="/authorize" component={require('./pages/AuthorizePage.es6').default} />

  //           <Route exact path="/compound/(home|local|federation)" component={require('./pages/TimelinePage.es6').default} />
  //           <Route exact path="/account/:acct/(home|local|federation)" component={require('./pages/TimelinePage.es6').default} />

  //         </Switch>
  //       </div>
  //     </Router>
  //   </RootElement>,
  //   document.getElementById('appContainer')
  // )
}
main()
