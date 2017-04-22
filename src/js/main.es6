import {Context, Dispatcher} from 'almin'
import React from 'react'
import ReactDOM from 'react-dom'
import {BrowserRouter as Router, Route, Switch} from 'react-router-dom'

import Application from './Application'
import AppStore from './store/AppStore'
import initializeDatabase from './infra'


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

  await initializeDatabase()

  ReactDOM.render(
    <Router>
      <div className="appContainer">
        <Switch>
          <Route exact path="/" component={require('./pages/AccountsPage.es6').default} />
          <Route exact path="/authorize" component={require('./pages/AuthorizePage.es6').default} />
        </Switch>
      </div>
    </Router>,
    document.getElementById('appContainer')
  )
}
main()
