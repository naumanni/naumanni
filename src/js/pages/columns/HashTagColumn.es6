import React from 'react'
import {FormattedMessage as _FM} from 'react-intl'

import {COLUMN_TAG, STREAM_TAG} from 'src/constants'
import {makeWebsocketUrl} from 'src/utils'
import {HashtagTimelineLoader} from 'src/controllers/TimelineLoader'
import TimelineListener from 'src/controllers/TimelineListener'
import {ColumnHeaderMenu, UserIconWithHost} from 'src/pages/parts'
import ReplaceColumnUseCase from 'src/usecases/ReplaceColumnUseCase'
import PagingColumn from './PagingColumn'
import TimelineColumn from './TimelineColumn'


/**
 * Hashtag Column
 */
export default class HashTagColumn extends TimelineColumn {
  static propTypes = {
    ...PagingColumn.propTypes,
  }

  /**
   * @override
   */
  renderTitle() {
    const {tag} = this.props

    return (
      <h1 className="column-headerTitle">
        <_FM id="column.title.hashtag" values={{tag}} />
      </h1>
    )
  }

  /**
   * @override
   */
  renderMenuContent() {
    const {tokens} = this.state.tokenState
    const subjects = this.props.subject.split(',')

    return (
      <ColumnHeaderMenu>
        <div className="menu-item">
          <h2><_FM id="column.menu.accountts.for" /></h2>
          <ul className="menu-accounts">
            {tokens.map((token) => {
              const {account} = token
              const isSelected = subjects.indexOf(account.acct) >= 0

              return (
                <li className={isSelected && 'is-selected'}
                    key={account.acct}
                    onClick={this.onToggleAccount.bind(this, account)}>
                  <UserIconWithHost account={account} size="small" />
                </li>
              )
            })}
          </ul>
          <p className="menu-note"><_FM id="column.menu.accountts.select_multiple_author" /></p>
        </div>
        <div className="menu-item--close" onClick={::this.onClickCloseColumn}>
          <_FM id="column.menu.close" />
        </div>
      </ColumnHeaderMenu>
    )
  }

  /**
   * @override
   */
  get listenerClass() {
    const {tag} = this.props

    class _TimelineListener extends TimelineListener {
      addListener(key, token) {
        const websocketUrl = makeWebsocketUrl(token, STREAM_TAG, {tag})
        super.addListener(key, token, websocketUrl)
      }
    }
    return _TimelineListener
  }

  /**
   * @override
   */
  makeLoaderForToken(timeline, token) {
    const {tag} = this.props

    return new HashtagTimelineLoader(tag, timeline, token, this.db)
  }


  /**
   * @override(temporary)
   */
  onRenderColumnMenu() {
    return null
  }

  // cb
  onToggleAccount({acct}, e) {
    let subjects = this.props.subject.split(',')

    if(e.shiftKey) {
      subjects = [...subjects]
      const idx = subjects.indexOf(acct)

      if(idx >= 0) {
        subjects.splice(idx, 1)
      } else {
        subjects.push(acct)
      }
    } else {
      subjects = [acct]
    }

    const {context} = this.context
    const {column, tag} = this.props
    const params = {
      menuVisible: true,
      subject: subjects.join(),
      tag,
    }

    context.useCase(new ReplaceColumnUseCase()).execute(column, column.type, params)
  }
}
require('./').registerColumn(COLUMN_TAG, HashTagColumn)
