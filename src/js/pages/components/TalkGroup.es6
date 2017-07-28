/* @flow */
import React from 'react'
import classNames from 'classnames'

import {Account} from 'src/models'
import {TalkBlock} from 'src/controllers/TalkListener'
import {TalkBubble, UserIconWithHost} from '../parts'


export class TalkGroupModel {
  _me: Account
  _talkGroup: TalkBlock
  _prevTalkGroup: ?TalkBlock
  _nextTalkGroup: ?TalkBlock

  /**
   * @constructor
   * @param{Account} me
   * @param{TalkBlock} talkGroup
   * @param{TalkBlock} prevTalkGroup
   * @param{TalkBlock} nextTalkGroup
   */
  constructor(me: Account, talkGroup: TalkBlock, prevTalkGroup: ?TalkBlock, nextTalkGroup: ?TalkBlock) {
    this._me = me
    this._talkGroup = talkGroup
    this._prevTalkGroup = prevTalkGroup
    this._nextTalkGroup = nextTalkGroup
  }

  get key(): string {
    return `speak-${this._talkGroup.account.acct}-${this._talkGroup.statuses[0].uri}`
  }

  get isMyTalk(): boolean {
    return this._talkGroup.account.isEqual(this._me)
  }

  get showName(): boolean {
    // memberのtalkgroupは、前のTalkGroupが自分であれば名前を表示しない
    return !this.isMyTalk &&
      !(this._prevTalkGroup && this._prevTalkGroup.account.isEqual(this._talkGroup.account))
  }

  get showAvatar(): boolean {
    // memberのtalkgroupは、次のTalkGroupが自分であればアバターを表示しない
    return !this.isMyTalk &&
      !(this._nextTalkGroup && this._nextTalkGroup.account.isEqual(this._talkGroup.account))
  }
}


export default class TalkGroup extends React.PureComponent {
  props: {
    isMyTalk: boolean,
    showAvatar: boolean,
    showName: boolean,
    talkGroup: TalkBlock,
    onClickHashTag: (string, SyntheticEvent) => void,
  }

  render() {
    const {
      isMyTalk, showName, showAvatar, talkGroup,
      onClickHashTag,
    } = this.props

    return (
      <div
        className={classNames(
          'talk-talkGroup',
          {'is-me': isMyTalk},
          {'is-member': !isMyTalk},
        )}
      >
        {showName && (
          <div className="talk-speakerName">
            {talkGroup.account.display_name || talkGroup.account.acct}
          </div>
        )}
        {showAvatar && (
          <div className="talk-speakerAvatar">
            <UserIconWithHost account={talkGroup.account} />
          </div>
        )}
        <ul className="talk-talkGroupStatuses">
          {talkGroup.contents.map(({key, parsedContent, createdAt, encrypted}) => (
            <TalkBubble
              key={key}
              createdAt={createdAt.toDate()}
              isEncrypted={encrypted}
              parsedContent={parsedContent}
              onClickHashTag={onClickHashTag}
            />
          ))}
        </ul>
      </div>
    )
  }
}
