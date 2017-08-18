/* @flow */
import React from 'react'
import classNames from 'classnames'
import {List} from 'immutable'
import {FormattedDate} from 'react-intl'

import {Attachment} from 'src/models'
import {IconFont, SafeContent} from './'


type Props = {
  createdAt: Date,
  isEncrypted: boolean,
  mediaFiles: List<Attachment>,
  parsedContent: List<{[type: string]: {[string]: any}}>,
  onClickHashTag: (string, SyntheticEvent) => void,
  onClickMedia: (e: SyntheticEvent, files: List<Attachment>, idx: number) => void,
}

export default class TalkBubble extends React.PureComponent {
  props: Props

  render() {
    const {createdAt, isEncrypted, mediaFiles, parsedContent, onClickHashTag} = this.props

    return (
      <li>
        <div className={`status-content ${isEncrypted ? 'is-encrypted' : ''}`}>
          <SafeContent parsedContent={parsedContent} onClickHashTag={onClickHashTag} />
          {this.renderMediaFilesInTalk(mediaFiles)}
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

  renderMediaFilesInTalk(files: List<Attachment>) {
    if(!files.size)
      return null

    return (
      <div className={classNames(
        'status-mediaList',
        `status-mediaList${files.size}`,
      )}>
        {files.map((media, idx) => (
          <a key={media.preview_url}
            className="status-media"
            style={{backgroundImage: `url(${media.preview_url})`}}
            target="_blank"
            href={media.url}
            onClick={(e) => this.props.onClickMedia(e, files, idx)}
            />
        ))}
      </div>
    )
  }
}
