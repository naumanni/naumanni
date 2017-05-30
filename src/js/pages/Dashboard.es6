import moment from 'moment'
import React from 'react'
import {IntlProvider, addLocaleData, intlShape} from 'react-intl'

import * as actions from 'src/actions'
import {NAUMANNI_VERSION} from 'src/constants'
import config from 'src/config'
import {AppPropType, ContextPropType} from 'src/propTypes'
import InitializeApplicationUseCase from 'src/usecases/InitializeApplicationUseCase'
import AddColumnUseCase from 'src/usecases/AddColumnUseCase'
import SignOutUseCase from 'src/usecases/SignOutUseCase'
import GenerateKeypairUseCase from 'src/usecases/GenerateKeypairUseCase'
import {AddTooltipUseCase, RemoveTooltipUseCase} from 'src/usecases/AddTooltipUseCase'
import {UITooltipGroup} from 'src/models'
import {raq} from 'src/utils'
import {messages as enMessages} from 'src/locales/en'  // enはstatic linkしたい
import ColumnContainer from './components/ColumnContainer'
import DashboardHeader from './components/DashboardHeader'
import ModalDialogContainer from './components/ModalDialogContainer'
import {TooltipContainer} from './components/TooltipContainer'


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
      initializing: true,
      locale: 'en',   // 初期ロケールはen
      ...this.getStateFromContext(),
    }
    this.state.messages = enMessages
    this.initialized = false
  }

  /**
   * @override
   */
  componentDidMount() {
    const {context} = this.props.app

    this.listenerRemovers = [
      context.onChange(::this.onConetextChanged),
      context.onDispatch(::this.onContextDispatch),
    ]

    const {intlProvider} = this.refs
    this.props.app.setIntl(intlProvider && intlProvider.getChildContext().intl)
  }

  /**
   * @override
   */
  componentDidUpdate(prevProps, prevState) {
    const {intlProvider} = this.refs
    this.props.app.setIntl(intlProvider && intlProvider.getChildContext().intl)
  }

  /**
   * @override
   */
  componentWillUnmount() {
    for(const remover of this.listenerRemovers) {
      remover()
    }
    this.props.app.setIntl(null)
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
    const {initializing, locale, messages, columns, dialogs, tokens, tooltips} = this.state
    return (
      <IntlProvider
        locale={locale}
        messages={messages}
        defaultLocale="en"
        ref="intlProvider"
      >
        {initializing ? (
        <div className="naumanniDashboard">
          <div className="naumanniDashboard-version">naumanni {NAUMANNI_VERSION}</div>
          <AppIntializer app={this.props.app} onInitialized={::this.onAppInitialized} />
        </div>
        ) : (
        <div
          className={`naumanniApp ${dialogs.length ? 'is-shownDialogs' : ''}`}
          onClick={::this.onClickDashboard}>
          <div className="naumanniDashboard">
            <DashboardHeader
              ref="header"
              tokens={tokens}
              onStartAddAccount={::this.onStartAddAccount}
              onOpenColumn={::this.onOpenColumn}
              onGenKey={::this.onGenKey}
              onShowSettings={::this.onShowSettings}
              onSignOut={::this.onSignOut}
            />
            <div className="naumanniDashboard-version">naumanni {NAUMANNI_VERSION}</div>
            <ColumnContainer ref="columnContainer" columns={columns} />
          </div>
          <ModalDialogContainer dialogs={dialogs} />
          <TooltipContainer tooltips={tooltips} />
        </div>
        )}
      </IntlProvider>
    )
  }

  getStateFromContext() {
    const state = this.props.app.context.getState()
    return {
      columns: state.columnState.columns,
      dialogs: state.dialogsState.dialogs,
      tokens: state.tokenState.allTokens,
      tooltips: state.tooltipState.tooltips,
    }
  }

  // callbacks
  /**
   * アプリの初期化が完了したら呼ばれる
   */
  onAppInitialized() {
    this.setState({initializing: false}, () => {
      // routing開始
      this.props.app.history.start()
      this.initialized = true
    })
  }

  onConetextChanged(changingStores) {
    raq(() => {
      this.setState(this.getStateFromContext())

      const {tokens} = this.state
      const {history} = this.props.app

      if(this.initialized && history.is(history.makeUrl('top'))) {
        // Tokenが一個もなく、ルートを表示しようとしたら、WelcomeDialogを表示する
        if(config.WELCOME_DIALOG && tokens.isEmpty()) {
          history.push(history.makeUrl('welcome'))
          this.initialized = false
        }

        // Tokenが一個で、columnsが0個だったら、tooltipを表示
        if(tokens.size === 1 && this.state.columns.length === 0) {
          const {context} = this.props.app
          const tooltips = new UITooltipGroup({tooltips: this.refs.header.buildTooltip()})

          context.useCase(new AddTooltipUseCase()).execute(tooltips)
          this.initialized = false
          this.tooltips = tooltips
        }

        if(tokens.size > 0) {
          this.initialized = false
        }
      }
    })

    this.onLocaleUpdated()
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

  /**
   * locale設定が更新されたかも
   */
  async onLocaleUpdated() {
    const {preferenceState} = this.props.app.context.getState()
    const newLocale = preferenceState.globals.locale

    if(!newLocale || this.state.locale === newLocale)
      return

    const {messages, localeData} = await import(`../locales/${newLocale}.es6`)
    moment.locale(newLocale)
    addLocaleData(localeData)
    this.setState({
      locale: newLocale,
      messages,
    })
    this.forceUpdate()
  }

  onStartAddAccount() {
    const {history} = this.props.app
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

  onShowSettings() {
    const {history} = this.props.app
    history.push(history.makeUrl('preferences'))
  }

  onSignOut(token) {
    const {formatMessage: _} = this.refs.intlProvider.getChildContext().intl
    const acct = token.acct || `<${token.host}>`

    if(window.confirm(_({id: 'dashboard.confirm.signout'}, {acct}))) {
      const {context} = this.props.app
      const {columns} = this.state

      context.useCase(new SignOutUseCase()).execute(token, columns)
    }
  }

  onClickDashboard() {
    if(this.tooltips) {
      const {context} = this.props.app
      context.useCase(new RemoveTooltipUseCase()).execute(this.tooltips)
      this.tooltips = null
    }
  }
}


// Dashboard local components
/**
 * 初期化して、ついでに状況を表示する奴
 * しかし状況は読み込み中しか無いのであった
 */
class AppIntializer extends React.Component {
  static contextTypes = {
    intl: intlShape,
  }

  constructor(...args) {
    super(...args)

    const {formatMessage: _} = this.context.intl

    this.state = {
      progress: _({id: 'dashboard.initialize.loading'}),
    }
  }

  /**
   * @override
   */
  componentDidMount() {
    const {context} = this.props.app

    context.useCase(new InitializeApplicationUseCase())
      .execute((progress) => this.setState())
      .then(() => this.props.onInitialized())
  }

  render() {
    return (
      <div className="naumanniDashboard-initializationProgress">{this.state.progress}</div>
    )
  }
}
