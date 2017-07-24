/* @flow */
import React from 'react'
import classNames from 'classnames'

import {Account} from 'src/models'
import {UserIconWithHost} from 'src/pages/parts'
import type {Hashtag, Suggestion} from './types'


type Props = {
  width: number,
  suggestions: Array<Suggestion>,
  selectedSuggestion: number,
  onClickSuggest: (Suggestion) => void,
}

export default class TootSuggest extends React.Component {
  props: Props

  render() {
    const {suggestions, width} = this.props

    return (
      <div className="tootForm-autoSuggestions" style={{width}}>
        {suggestions.length > 0 && suggestions.map((item, idx) => {
          // exists only 2 types(account or hashtag) for now
          if(item instanceof Account) {
            return this.renderAccount(item, idx)
          } else {
            return this.renderHashtag(item, idx)
          }
        })}
      </div>
    )
  }

  // render
  renderAccount(account: Account, idx: number) {
    return (
      <div {...this.suggestItemProps(account, idx)}>
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
    )
  }

  renderHashtag(hashtag: Hashtag, idx: number) {
    return (
      <div {...this.suggestItemProps(hashtag, idx)}>
        <div className="tootForm-autoSuggestions-namebox">
          <p className="tootForm-autoSuggestions-account">
            {`#${hashtag}`}
          </p>
        </div>
      </div>
    )
  }

  // private
  suggestItemProps(item: Suggestion, idx: number) {
    const {onClickSuggest, selectedSuggestion} = this.props

    return {
      key: item instanceof Account ? item.uri : item,
      role: 'button',
      className: classNames(
          'tootForm-autoSuggestions-item',
          {'selected': idx === selectedSuggestion}),
      onClick: () => onClickSuggest(item),
    }
  }
}
