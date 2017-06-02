import React from 'react'
import PropTypes from 'prop-types'
import Textarea from 'react-textarea-autosize'
import classNames from 'classnames'

import {
  KEY_TAB, KEY_ENTER, KEY_ESC, KEY_ARROW_UP, KEY_ARROW_DOWN, TOOTFORM_PLACEHOLDER,
} from 'src/constants'
import {OAuthTokenListPropType} from 'src/propTypes'
import {textAtCursorMatchesToken} from 'src/utils'
import {UserIconWithHost} from 'src/pages/parts'


const MAX_SUGGESTIONS = 6
const MIN_ROWS = 3
const LINE_HEIGHT = 20
const getMaxTootRows = () => {
  const staticHeightExceptTootTextArea = 400  // really rongh estimate...
  return Math.floor((document.body.clientHeight - staticHeightExceptTootTextArea) / LINE_HEIGHT)
}


export default class AutoSuggestTextarea extends React.Component {
  static propTypes = {
    statusContent: PropTypes.string.isRequired,
    tokens: OAuthTokenListPropType.isRequired,
    onChangeStatus: PropTypes.func.isRequired,
    onKeyDown: PropTypes.func.isRequired,
  }

  /**
   * @constructor
   */
  constructor(...args) {
    super(...args)

    this.state = {
      lastSuggestQuery: null,
      selectedSuggestion: 0,
      suggestions: [],
      suggestionsHidden: false,
    }
  }

  /**
   * @override
   */
  componentDidMount() {
    this.refs.textareaStatus.focus()
  }

  /**
   * @override
   */
  render() {
    const {statusContent} = this.props

    return (
      <div className="tootForm-statusContainer">
        <Textarea
          ref="textareaStatus"
          className="tootForm-status"
          value={statusContent}
          placeholder={TOOTFORM_PLACEHOLDER}
          onKeyDown={::this.onKeyDown}
          onChange={::this.onChange}
          minRows={MIN_ROWS}
          maxRows={getMaxTootRows()}></Textarea>

        {this.renderSuggestions()}
      </div>
    )
  }

  // render
  renderSuggestions() {
    const {suggestions, suggestionsHidden, selectedSuggestion} = this.state

    if(suggestions.length === 0 || suggestionsHidden) {
      return null
    }

    return (
      <div className="tootForm-autoSuggestions">
          {suggestions.map((account, i) => (
            <div
              role="button"
              key={account.uri}
              className={classNames(
                'tootForm-autoSuggestions-item',
                {'selected': i === selectedSuggestion},
              )}
              onClick={this.onClickSuggestion.bind(this, account)}
            >
              <UserIconWithHost account={account} size="mini" />
              <div className="tootForm-autoSuggestions-namebox">
                <p className="tootForm-autoSuggestions-name">
                  {account.display_name && ` ${account.display_name}`}
                </p>
                <p className="tootForm-autoSuggestions-account">
                  {`@${account.acct}`}
                </p>
              </div>
            </div>
            ))
          }
      </div>
    )
  }

  // private
  async fetchSuggestions(q, limit=MAX_SUGGESTIONS) {
    const results = await Promise.all(
      this.props.tokens
        .map(async ({requester}) => await requester.searchAccount({q, limit}))
    )
    let accounts = {}
    let keys = []
    results.forEach(({entities, result}) => {
      accounts = {...accounts, ...entities.accounts}
      keys = [...keys, ...result]
    })
    const suggestions = keys
      .filter((k, i) => keys.indexOf(k) === i)
      .map((k) => accounts[k])
      .slice(0, MAX_SUGGESTIONS)

    this.setState({suggestions})
  }

  onSuggestionSelected(account) {
    const {value: currentStatus} = this.refs.textareaStatus
    const {suggestStart, lastSuggestQuery} = this.state
    const statusContent =
      `${currentStatus.slice(0, suggestStart)}${account.acct}` +
      ' ' +
      `${currentStatus.slice(suggestStart + lastSuggestQuery.length)}`

    this.props.onChangeStatus(statusContent)
    this.setState({
      suggestions: [],
    })

    const node = document.getElementsByClassName('tootForm-status')[0]
    const pos = suggestStart + account.acct.length
    setTimeout(() => {
      node.focus()
      node.setSelectionRange(pos, pos)
    }, 10)  // needs delay after update statusContent
  }

  // cb
  onChange(e) {
    const [suggestStart, suggestQuery] = textAtCursorMatchesToken(e.target.value, e.target.selectionStart)

    if(suggestQuery !== null && this.state.lastSuggestQuery !== suggestQuery) {
      this.setState({
        suggestStart,
        lastSuggestQuery: suggestQuery,
        selectedSuggestion: 0,
        suggestionsHidden: false,
      })
      this.fetchSuggestions(suggestQuery)
    } else if(suggestQuery === null) {
      this.setState({
        lastSuggestQuery: null,
        suggestions: [],
      })
    }

    this.props.onChangeStatus(e.target.value)
  }

  onKeyDown(e) {
    this.props.onKeyDown(e)
    const {suggestions, selectedSuggestion, suggestionsHidden} = this.state

    if(e.keyCode == KEY_ESC && !suggestionsHidden) {
      e.preventDefault()
      this.setState({suggestionsHidden: true})
    } else if(e.keyCode == KEY_ARROW_DOWN) {
      if(suggestions.length > 0 && !suggestionsHidden) {
        e.preventDefault()
        this.setState({selectedSuggestion: Math.min(selectedSuggestion + 1, suggestions.length - 1)})
      }
    } else if(e.keyCode == KEY_ARROW_UP) {
      if(suggestions.length > 0 && !suggestionsHidden) {
        e.preventDefault()
        this.setState({selectedSuggestion: Math.max(selectedSuggestion - 1, 0)})
      }
    } else if(e.keyCode == KEY_TAB || e.keyCode == KEY_ENTER) {
      if(this.state.lastSuggestQuery !== null && suggestions.length > 0 && !suggestionsHidden) {
        e.preventDefault()
        e.stopPropagation()
        this.onSuggestionSelected(suggestions[selectedSuggestion])
      }
    }
  }

  onClickSuggestion(account) {
    this.onSuggestionSelected(account)
  }
}
