import React from 'react'
import {FormattedMessage as _FM} from 'react-intl'

import {COLUMN_TAG, STREAM_TAG} from 'src/constants'
import {makeWebsocketUrl} from 'src/utils'
import {HashtagTimelineLoader} from 'src/controllers/TimelineLoader'
import TimelineListener from 'src/controllers/TimelineListener'
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
}
require('./').registerColumn(COLUMN_TAG, HashTagColumn)
