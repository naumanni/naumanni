/* @flow */
import React from 'react'
import classNames from 'classnames'
import {List} from 'immutable'
import {FormattedDate} from 'react-intl'

import {
  TOOT_SEND_SUCCESS, TOOT_SEND_SENDING, TOOT_SEND_FAIL,
} from 'src/constants'
import {Attachment} from 'src/models'
import {IconFont, SafeContent} from './'


type SendStatus = TOOT_SEND_SUCCESS | TOOT_SEND_SENDING | TOOT_SEND_FAIL
type Props = {
  createdAt: Date,
  isEncrypted: boolean,
  isMyTalk: boolean,
  mediaFiles: List<Attachment>,
  sendStatus: SendStatus,
  parsedContent: List<{[type: string]: {[string]: any}}>,
  onClickHashTag: (string, SyntheticEvent) => void,
  onClickMedia: (e: SyntheticEvent, files: List<Attachment>, idx: number) => void,
}

export default class TalkBubble extends React.PureComponent {
  props: Props

  render() {
    const {
      createdAt, isEncrypted, isMyTalk, mediaFiles, parsedContent, sendStatus,
      onClickHashTag,
    } = this.props

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
        {isMyTalk &&
          <div className="status-sendStatus">
            {this.renderTalkSendStatus(sendStatus)}
          </div>
        }
        {isEncrypted && <div className="status-isEncrypted"><IconFont iconName="lock" /></div>}
      </li>
    )
  }

  // TODO: This should be temporary.
  // css class name will be corresponding with `sendStatus`
  renderTalkSendStatus(sendStatus: SendStatus) {
    let iconName

    switch(sendStatus) {
    case TOOT_SEND_SUCCESS:
      iconName = 'talk'  // TODO:
      break
    case TOOT_SEND_SENDING:
      iconName = 'mail'  // TODO:
      break
    case TOOT_SEND_FAIL:
      iconName = 'doc'  // TODO:
      break
    }

    return <IconFont iconName={iconName} />
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
