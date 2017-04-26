import React from 'react'
import PropTypes from 'prop-types'

import InitializeApplicationUseCase from 'src/usecases/InitializeApplicationUseCase'
import DashboardHeader from './components/DashboardHeader'


export default class Dashboard extends React.Component {
  static get childContextTypes() {
    return {context: PropTypes.any}
  }

  constructor(...args) {
    super(...args)

    this.state = {
      initializer: <AppIntializer app={this.props.app} onInitialized={::this.onAppInitialized} />,
    }
  }

  /**
   * @override
   */
  getChildContext() {
    return {context: this.props.app.context}
  }

  /**
   * @override
   */
  componentDidMount() {
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
        <div className="naumanniDashboard">{initializer}</div>
      )
    }


    return (
      <div className="naumanniDashboard">
        <DashboardHeader />
      </div>
    )
  }

  // callbacks
  /**
   * アプリの初期化が完了したら呼ばれる
   */
  onAppInitialized() {
    this.setState({initializer: null})
  }
}


// // Dashboard local components

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
