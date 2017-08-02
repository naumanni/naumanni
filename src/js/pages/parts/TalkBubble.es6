/* @flow */
import React from 'react'
import {List} from 'immutable'
import {FormattedDate} from 'react-intl'

import {IconFont, SafeContent} from './'


type Props = {
  createdAt: Date,
  isEncrypted: boolean,
  parsedContent: List<{[type: string]: {[string]: any}}>,
  onClickHashTag: (string, SyntheticEvent) => void,
}

export default class TalkBubble extends React.PureComponent {
  props: Props

  render() {
    const {createdAt, isEncrypted, parsedContent, onClickHashTag} = this.props

    return (
      <li>
        <div className={`status-content ${isEncrypted ? 'is-encrypted' : ''}`}>
          <SafeContent parsedContent={parsedContent} onClickHashTag={onClickHashTag} />
        </div>
        <div className="status-date">
          <FormattedDate value={createdAt}
            year="numeric" month="2-digit" day="2-digit"
            hour="2-digit" minute="2-digit" second="2-digit"
          />
        </div>
        {isEncrypted && <div className="status-isEncrypted"><IconFont iconName="lock" /></div>}
      </li>
    )
  }
}
