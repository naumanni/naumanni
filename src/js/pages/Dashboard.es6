import React from 'react'
import PropTypes from 'prop-types'

import {NAUMANNI_VERSION} from 'src/constants'
import InitializeApplicationUseCase from 'src/usecases/InitializeApplicationUseCase'
import ColumnContainer from './components/ColumnContainer'
import DashboardHeader from './components/DashboardHeader'
import ModalDialogContainer from './components/ModalDialogContainer'


export default class Dashboard extends React.Component {
  static get childContextTypes() {
    return {
      app: PropTypes.any,
      context: PropTypes.any,
    }
  }

  constructor(...args) {
    super(...args)

    this.state = {
      initializer: <AppIntializer app={this.props.app} onInitialized={::this.onAppInitialized} />,
      ...this.getStateFromContext(),
    }
  }

  /**
   * @override
   */
  componentDidMount() {
    const {context} = this.props.app

    this.listenerRemovers = [
      context.onChange(() => this.setState(this.getStateFromContext())),
    ]
  }

  /**
   * @override
   */
  componentWillUnmount() {
    for(const remover of this.listenerRemovers) {
      remover()
    }
  }

  /**
   * @override
   */
  getChildContext() {
    return {
      app: this.props.app,
      context: this.props.app.context,
    }
  }

  /**
   * @override
   */
  render() {
    const {
      initializer,
    } = this.state

    if(initializer) {
      return (
        <div className="naumanniDashboard">
          <div className="naumanniDashboard-version">
            {NAUMANNI_VERSION}
            {initializer}
          </div>
        </div>
      )
    }

    const {dialogs} = this.state

    return (
      <div className={`naumanniApp ${dialogs.length ? 'is-shownDialogs' : ''}`}>
        <div className="naumanniDashboard">
          <div className="naumanniDashboard-version">{NAUMANNI_VERSION}</div>
          <DashboardHeader />
          <ColumnContainer />
        </div>
        <ModalDialogContainer dialogs={dialogs} />
      </div>
    )
  }

  getStateFromContext() {
    const {context} = this.props.app
    const state = context.getState()
    return {dialogs: state.dialogsState.dialogs}
  }

  // callbacks
  /**
   * アプリの初期化が完了したら呼ばれる
   */
  onAppInitialized() {
    this.setState({initializer: null}, () => {
      // routing開始
      this.props.app.history.start()
    })
  }
}


// Dashboard local components
/**
 * 初期化して、ついでに状況を表示する奴
 */
class AppIntializer extends React.Component {
  constructor(...args) {
    super(...args)

    this.state = {
      progress: '読み込み中...',
    }
  }

  /**
   * @override
   */
  componentDidMount() {
    const {context} = this.props.app

    context.useCase(new InitializeApplicationUseCase()).execute((progress) => this.setState())
      .then(() => this.props.onInitialized())
  }

  render() {
    return (
      <div className="naumanniDashboard-initializationProgress">{this.state.progress}</div>
    )
  }
}
