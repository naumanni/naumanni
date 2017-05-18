import React from 'react'

import * as actions from 'src/actions'
import {NAUMANNI_VERSION} from 'src/constants'
import {AppPropType, ContextPropType} from 'src/propTypes'
import InitializeApplicationUseCase from 'src/usecases/InitializeApplicationUseCase'
import AddColumnUseCase from 'src/usecases/AddColumnUseCase'
import GenerateKeypairUseCase from 'src/usecases/GenerateKeypairUseCase'

import ColumnContainer from './components/ColumnContainer'
import DashboardHeader from './components/DashboardHeader'
import ModalDialogContainer from './components/ModalDialogContainer'


export default class Dashboard extends React.Component {
  static get childContextTypes() {
    return {
      app: AppPropType,
      context: ContextPropType,
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
      context.onDispatch(::this.onContextDispatch),
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
          <div className="naumanniDashboard-version">{NAUMANNI_VERSION}</div>
          {initializer}
        </div>
      )
    }

    const {columns, dialogs, tokens} = this.state

    return (
      <div className={`naumanniApp ${dialogs.length ? 'is-shownDialogs' : ''}`}>
        <div className="naumanniDashboard">
          <DashboardHeader
            tokens={tokens}
            onStartAddAccount={::this.onStartAddAccount}
            onOpenColumn={::this.onOpenColumn}
            onGenKey={::this.onGenKey}
          />
          <div className="naumanniDashboard-version">{NAUMANNI_VERSION}</div>
          <ColumnContainer ref="columnContainer" columns={columns} />
        </div>
        <ModalDialogContainer dialogs={dialogs} />
      </div>
    )
  }

  getStateFromContext() {
    const {context} = this.props.app
    const state = context.getState()
    return {
      columns: state.columnState.columns,
      dialogs: state.dialogsState.dialogs,
      tokens: state.tokenState.allTokens,
    }
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

  onContextDispatch(payload) {
    switch(payload.type) {
    case actions.COLUMN_ADD_REQUESTED: {
        // カラムが追加されたらそこにFocusする
      const {column} = payload
      this.refs.columnContainer.scrollToColumn(column.key)
      break
    }
    }
  }

  onStartAddAccount() {
    const {history} = this.props.app
    // TODO: named routingしたい
    history.push(history.makeUrl('accountAdd'))
  }

  onOpenColumn(columnType, columnParams) {
    const {context} = this.props.app

    context.useCase(new AddColumnUseCase()).execute(columnType, columnParams)
  }

  onGenKey(token, account) {
    const {context} = this.props.app

    context.useCase(
      new GenerateKeypairUseCase()
    ).execute(token, account)
  }
}


// Dashboard local components
/**
 * 初期化して、ついでに状況を表示する奴
 * しかし状況は読み込み中しか無いのであった
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
