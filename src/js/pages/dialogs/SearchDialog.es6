import React from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage as _FM} from 'react-intl'

import {
  COLUMN_TAG, COLUMN_TALK,
  SEARCH_PATH,
  SUBJECT_MIXED,
} from 'src/constants'
import AddColumnUseCase from 'src/usecases/AddColumnUseCase'
import TimelineActions from 'src/controllers/TimelineActions'
import AccountRow from '../components/AccountRow'
import {HistoryBaseDialog} from './Dialog'
import {UserIconWithHost} from 'src/pages/parts'


/**
 * 検索ダイアログ
 */
export default class SearchDialog extends HistoryBaseDialog {
  static propTypes = {
    q: PropTypes.string,
  }

  /**
   * override
   */
  constructor(...args) {
    super(...args)

    const contextState = this.context.context.getState()
    const {tokens} = contextState.tokenState

    this._tokens = tokens
    this.actionDelegate = new TimelineActions(this.context)
    this.state = {
      accounts: [],
      hashtags: [],
      optionVisible: false,
      searchTargets: this.tokens.map(({acct}) => acct).toJS(),
    }
  }

  get tokens() {
    return this._tokens
  }

  /**
   * override
   */
  componentDidMount() {
    super.componentDidMount()
    const {q} = this.props

    if(q)
      this.updateQuery(q)

    this.refs.search.focus()
  }

  /**
   * @override
   */
  renderHeader() {
    return <h1><_FM id="search_dialog.title" /></h1>
  }

  /**
   * @override
   */
  renderBody() {
    const {formatMessage: _} = this.context.intl
    const {optionVisible} = this.state

    return (
      <div className="dialog--search">
        <input
          type="text" ref="search"
          className="search-hashtagInput"
          placeholder={_({id: 'search_dialog.label.search_placeholder'})}
          onChange={(e) => this.updateQuery(e.target.value)}
        />

        <div className="search-options">
          <h2 onClick={::this.onToggleOptionVisible}>
            <_FM id="search_dialog.label.option" />
          </h2>
          {optionVisible && this.renderOptions()}
        </div>

        <div className="search-results">
          {this.renderHashtags()}
          {this.renderAccounts()}
        </div>
      </div>
    )
  }

  renderOptions() {
    const {searchTargets} = this.state

    return (
      <div className="search-options-item">
        <div className="searchFor">
          <p className="note">
            <_FM id="search_dialog.note.search_for_accounts" />
          </p>
          <h2><_FM id="search_dialog.note.search_for" /></h2>
          <ul>
            {this.tokens.map((token) => {
              const {account} = token
              const isSelected = searchTargets.indexOf(account.acct) >= 0

              return (
                <li className={isSelected && 'is-selected'}
                    key={account.acct}
                    onClick={this.onToggleSearchTarget.bind(this, account)}>
                  <UserIconWithHost account={account} size="small" />
                </li>
              )
            })}
          </ul>
          <p className="searchFor-note"><_FM id="search_dialog.note.select_multiple_author" /></p>
        </div>
      </div>
    )
  }

  renderHashtags() {
    const {hashtags} = this.state

    return (
      <div className="search-results-hashtags">
        <h2><_FM id="search_dialog.results.label.hashtags" /></h2>
        <ul>
          {hashtags.map((tag) => (
            <a href="#" onClick={this.onClickTag.bind(this, tag)}>
              <li key={tag} className="search-results-hashtags-item">
                {`#${tag}`}
              </li>
            </a>
          ))}
        </ul>
      </div>
    )
  }

  renderAccounts() {
    const {accounts} = this.state

    return (
      <div className="search-results-accounts">
        <h2><_FM id="search_dialog.results.label.accounts" /></h2>
        <ul>
          {accounts.map((account) => (
            <li key={account.key}>
              <AccountRow
                account={account}
                onClick={::this.onClickAccount}
                {...this.actionDelegate.props}
              />
            </li>
          ))}
        </ul>
      </div>
    )
  }

  // private
  updateQuery(q) {
    const path = `${SEARCH_PATH}/${q}`

    if(path !== location.pathname)
      history.replaceState(null, null, path)

    this.fetchEntities(q)
  }

  async fetchEntities(q) {
    const {searchTargets} = this.state
    let entities = {}
    entities.accounts = {}
    entities.hashtags = []

    const results = await Promise.all(
      this.tokens
        .filter(({acct}) => searchTargets.indexOf(acct) >= 0)
        .map(async ({requester}) => await requester.search({q, resolve: 'true'}))
        .toJS()
    )

    results
      .map((r) => r.entities)
      .forEach(({accounts, hashtags}) => {
        Object.keys(accounts || {}).forEach((k) => {
          entities.accounts[k] = accounts[k]
        })

        hashtags.forEach((hashtag) => {
          if(entities.hashtags.indexOf(hashtag) < 0) {
            entities.hashtags.push(hashtag)
          }
        })
      })

    this.setState({
      accounts: Object.values(entities.accounts),
      hashtags: entities.hashtags,
    })
  }

  addColumn(tasks) {
    Promise.all(tasks)
      .then(() => {
        this.app.history.replace(this.app.history.makeUrl('top'))
      })
  }

  // cb
  onToggleOptionVisible(e) {
    this.setState({optionVisible: !this.state.optionVisible})
  }

  onToggleSearchTarget(account, e) {
    let {searchTargets} = this.state

    if(e.shiftKey) {
      searchTargets = [...searchTargets]
      const idx = searchTargets.indexOf(account.acct)

      if(idx >= 0) {
        searchTargets.splice(idx, 1)
      } else {
        searchTargets.push(account.acct)
      }
    } else {
      searchTargets = [account.acct]
    }

    this.setState({searchTargets})
  }

  onClickTag(tag, e) {
    e.preventDefault()
    const {context} = this.context
    const tasks = [
      context.useCase(new AddColumnUseCase()).execute(COLUMN_TAG, {
        subject: SUBJECT_MIXED,  // TODO: comma separated accounts
        tag,
      }),
    ]

    this.addColumn(tasks)
  }

  onClickAccount(account) {
    const {context} = this.context
    const {searchTargets} = this.state
    const tasks = searchTargets
      .filter((from) => account.acct !== from)
      .map(async (from) => (
        await context.useCase(new AddColumnUseCase()).execute(COLUMN_TALK, {
          to: account.acct,
          from,
        })
      ))

    this.addColumn(tasks)
  }
}
