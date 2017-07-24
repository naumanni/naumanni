/* @flow */
import React from 'react'
import Textarea from 'react-textarea-autosize'
import {List} from 'immutable'

import {
  KEY_TAB, KEY_ENTER, KEY_ESC, KEY_ARROW_UP, KEY_ARROW_DOWN, TOOTFORM_PLACEHOLDER,
} from 'src/constants'
import {OAuthToken, Account} from 'src/models'
import {textAtCursorMatchesToken} from 'src/utils'
import TootSuggest from './TootSuggest'
import type {Suggestion} from './types'


const SUGGEST_PREFIX_ACCOUNT = '@'
const SUGGEST_PREFIX_HASHTAG = '#'
const MAX_SUGGESTIONS = 6
const MIN_ROWS = 3
const LINE_HEIGHT = 20
const getMaxTootRows = () => {
  const staticHeightExceptTootTextArea = 400  // really rough estimate...

  if(document.body != null) {
    return Math.floor((document.body.clientHeight - staticHeightExceptTootTextArea) / LINE_HEIGHT)
  }
  return 0
}
const fetchSuggestFunctionMap = {
  [SUGGEST_PREFIX_ACCOUNT]: fetchAccountSuggestions,
  [SUGGEST_PREFIX_HASHTAG]: fetchHashtagSuggestions,
}

async function fetchAccountSuggestions(tokens: List<OAuthToken>, q: string, limit: number = MAX_SUGGESTIONS) {
  const results = await Promise.all(
    tokens
      .map(async ({requester}) => await requester.searchAccount({q, limit}))
  )
  let accounts = {}
  let keys = []
  results.forEach(({entities, result}) => {
    accounts = {...accounts, ...entities.accounts}
    keys = [...keys, ...result]
  })

  return keys
    .filter((k, i) => keys.indexOf(k) === i)
    .map((k) => accounts[k])
    .slice(0, MAX_SUGGESTIONS)
}

async function fetchHashtagSuggestions(tokens: List<OAuthToken>, q: string) {
  let suggestions = []

  const results = await Promise.all(
    tokens
      .map(async ({requester: {search}}) => await search({q, resolve: 'true'}))
      .toJS()
  )

  results
    .map((r) => r.entities)
    .forEach(({hashtags}) => {
      hashtags.forEach((hashtag) => {
        if(suggestions.indexOf(hashtag) < 0) {
          suggestions.push(hashtag)
        }
      })
    })

  return suggestions
}


type Props = {
  statusContent: string,
  tokens: List<OAuthToken>,
  onChangeStatus: (string) => void,
  onKeyDown: (SyntheticKeyboardEvent) => void,
}

type State = {
  lastSuggestQuery: ?string,
  selectedSuggestion: number,
  suggestions: Array<Suggestion>,
  suggestStart: ?number,
  suggestionsHidden: boolean,
}

export default class AutoSuggestTextarea extends React.Component {
  props: Props
  state: State

  /**
   * @constructor
   */
  constructor(...args: any[]) {
    super(...args)

    this.state = {
      lastSuggestQuery: null,
      selectedSuggestion: 0,
      suggestions: [],
      suggestStart: null,
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
      <div className="tootForm-statusContainer" ref="statusContainer">
        <Textarea
          ref="textareaStatus"
          className="tootForm-status"
          value={statusContent}
          placeholder={TOOTFORM_PLACEHOLDER}
          onKeyDown={this.onKeyDown.bind(this)}
          onChange={this.onChange.bind(this)}
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

    const container = this.refs.statusContainer

    return <TootSuggest
      width={container ? container.clientWidth : 0}
      suggestions={suggestions}
      selectedSuggestion={selectedSuggestion}
      onClickSuggest={this.onSuggestionSelected.bind(this)}
    />
  }

  // private
  async fetchSuggestions(tokens: List<OAuthToken>, prefix: string, q: string) {
    const suggestions = await fetchSuggestFunctionMap[prefix](tokens, q)

    this.setState({suggestions})
  }

  onSuggestionSelected(suggestion: Suggestion) {
    // exists only 2 types(account or hashtag) for now
    const selected = suggestion instanceof Account ? suggestion.acct : suggestion
    const {value: currentStatus} = this.refs.textareaStatus
    const {suggestStart, lastSuggestQuery} = this.state
    if(lastSuggestQuery != null) {
      const statusContent =
        `${currentStatus.slice(0, suggestStart)}${selected}` +
        ' ' +
        `${currentStatus.slice(suggestStart + lastSuggestQuery.length)}`
      this.props.onChangeStatus(statusContent)
      this.setState({
        suggestions: [],
      })
    }

    const node = this.refs.textareaStatus
    if(node) {
      node.focus()
    }
  }

  // cb
  onChange(e: SyntheticInputEvent) {
    const {target: {value: str, selectionStart: caretPosition}} = e
    let lastSuggestQuery

    for(const prefix of Object.keys(fetchSuggestFunctionMap)) {
      const [suggestStart, suggestQuery] = textAtCursorMatchesToken(prefix, str, caretPosition)

      if(suggestQuery !== null && this.state.lastSuggestQuery !== suggestQuery) {
        lastSuggestQuery = suggestQuery
        this.setState({
          suggestStart,
          lastSuggestQuery: suggestQuery,
          selectedSuggestion: 0,
          suggestionsHidden: false,
        })
        this.fetchSuggestions(this.props.tokens, prefix, suggestQuery)
      }
    }
    if(!lastSuggestQuery) {
      this.setState({
        lastSuggestQuery: null,
        suggestions: [],
      })
    }
    this.props.onChangeStatus(e.target.value)
  }

  onKeyDown(e: SyntheticKeyboardEvent) {
    this.props.onKeyDown(e)
    const {suggestions, selectedSuggestion, suggestionsHidden} = this.state

    if(e.keyCode == KEY_ESC && !suggestionsHidden) {
      // ESCでサジェストを閉じたい
      e.preventDefault()
      this.setState({suggestionsHidden: true})
    } else if(e.keyCode == KEY_ARROW_DOWN) {
      // ↓ で次のサジェストにフォーカスしたい
      if(suggestions.length > 0 && !suggestionsHidden) {
        e.preventDefault()
        this.setState({selectedSuggestion: Math.min(selectedSuggestion + 1, suggestions.length - 1)})
      }
    } else if(e.keyCode == KEY_ARROW_UP) {
      if(suggestions.length > 0 && !suggestionsHidden) {
      // ↑ で前のサジェストにフォーカスしたい
        e.preventDefault()
        this.setState({selectedSuggestion: Math.max(selectedSuggestion - 1, 0)})
      }
    } else if(e.keyCode == KEY_TAB || e.keyCode == KEY_ENTER) {
      if(this.state.lastSuggestQuery !== null && suggestions.length > 0 && !suggestionsHidden) {
        // TAB or ENTER でフォーカスしているサジェストを決定したい
        e.preventDefault()
        e.stopPropagation()
        this.onSuggestionSelected(suggestions[selectedSuggestion])
      }
    }
  }
}
