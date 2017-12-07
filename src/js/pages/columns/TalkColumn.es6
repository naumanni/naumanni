/* @flow */
import React from 'react'
import update from 'immutability-helper'
import {findDOMNode} from 'react-dom'
import {List} from 'immutable'
import {FormattedMessage as _FM} from 'react-intl'
import classNames from 'classnames'
import {intlShape} from 'react-intl'

import {ContextPropType} from 'src/propTypes'
import {
  COLUMN_TALK,
  SUBJECT_MIXED,
  KEY_ENTER,
} from 'src/constants'
import {StatusRef} from 'src/infra/TimelineData'
import {Account, Attachment} from 'src/models'
import SendDirectMessageUseCase from 'src/usecases/SendDirectMessageUseCase'
import {TalkBlock} from 'src/controllers/TalkListener'
import TalkGroup, {TalkGroupModel} from 'src/pages/components/TalkGroup'
import TalkForm from 'src/pages/components/TalkForm'
import {ColumnHeader, ColumnHeaderMenu, NowLoading} from '../parts'
import {registerColumn} from 'src/pages/uiColumns'
import type {ColumnProps} from './types'


type Props = ColumnProps & {
  me: ?Account,
  members: ?{[acct: string]: Account},
  talk: ?TalkBlock[],
  onClickHashTag: (string) => void,
  onClickMedia: (mediaFiles: List<Attachment>, idx: number) => void,
  onPushLocalStatus: (accountUri: string, message: string) => ?Function,
}

type State = {
  keepAtBottom: boolean,
  mediaFiles: File[],
  isMenuVisible: boolean,
  newMessage: string,
  sendingMessage: boolean,
  sensitive: boolean,
}

/**
 * タイムラインのカラム
 */
export default class TalkColumn extends React.Component {
  props: Props
  state: State

  static contextTypes = {
    context: ContextPropType,
    intl: intlShape,
  }

  mediaFileKeys: WeakMap<File, number>
  mediaFileCounter: number
  scrollChanging: boolean
  textNode: ?HTMLInputElement

  /**
   * @constructor
   */
  constructor(...args: any[]) {
    // mixed timeline not allowed
    require('assert')(args[0].subject !== SUBJECT_MIXED)
    super(...args)

    // コードからスクロール量を変更している場合はtrue
    this.scrollChanging = false
    this.state = {
      keepAtBottom: true,
      mediaFiles: [],
      isMenuVisible: false,
      newMessage: '',
      sendingMessage: false,
      sensitive: false,
    }
    this.setUpMediaCounter()
  }

  /**
   * @override
   */
  componentDidMount() {
    this.props.onSubscribeListener()
  }

  /**
   * @override
   */
  componentWillUnmount() {
    this.props.onUnsubscribeListener()
  }

  /**
   * @override
   */
  componentDidUpdate(prevProps: Props, prevState: State) {
    if(this.state.keepAtBottom) {
      const node = this.refs.talkGroups
      if(node) {
        this.scrollChanging = true
        node.scrollTop = node.scrollHeight
      }
    }
  }

  /**
   * @override
   */
  render() {
    const {
      isDragging, connectDragSource, connectDropTarget,
      isLoading,
    } = this.props

    const opacity = isDragging ? 0 : 1

    return connectDropTarget(
      <div className="column" style={{opacity}}>
        {connectDragSource(
          <div>
            <ColumnHeader
              canShowMenuContent={!isLoading}
              isPrivate={true}
              menuContent={this.renderMenuContent()}
              title={this.renderTitle()}
              onClickHeader={this.onClickHeader.bind(this)}
              onClickMenu={this.onClickMenuButton.bind(this)}
            />
          </div>
        )}

        {isLoading
          ? <div className="column-body is-loading"><NowLoading /></div>
          : this.renderBody()
        }
      </div>
    )
  }

  // render private

  renderTitle() {
    const {me, members} = this.props

    if(!me || !members) {
      return <_FM id="column.title.talk" />
    }

    const memberNames = Object.values(members)
      .map((a: Account) => a.displayName || a.acct)

    return (
      <h1 className="column-headerTitle">
        <div className="column-headerTitleSub">{me.acct}</div>
        <div className="column-headerTitleMain">
          <_FM id="column.title.talk_with" values={{memberNames}} />
        </div>
      </h1>
    )
  }

  renderMenuContent() {
    return <ColumnHeaderMenu isCollapsed={!this.state.isMenuVisible} onClickClose={this.props.onClose} />
  }

  renderBody() {
    const {formatMessage: _} = this.context.intl

    if(this.props.isLoading) {
      return <NowLoading />
    }

    const {isLoading, talk} = this.props
    const {mediaFiles, newMessage, sensitive} = this.state

    return (
      <div className={classNames(
        'column-body',
        'column-body--talk',
        {'is-loading': isLoading},
      )}>
        <ul className="talk-talkGroups" ref="talkGroups" onScroll={this.onScrollTalkGroups.bind(this)}>
          {(talk || []).map((talkGroup, idx, talk) => this.renderTalkGroup(talkGroup, talk[idx - 1], talk[idx + 1]))}
        </ul>
        <TalkForm
          mediaFiles={mediaFiles}
          mediaFileKeys={this.mediaFileKeys}
          placeholder={_({id: 'talk.form.placeholder'})}
          sensitive={sensitive}
          text={newMessage}
          onChange={this.onChangeMessage.bind(this)}
          onChangeMediaFile={this.onChangeMediaFile.bind(this)}
          onClickToggleNsfw={this.onClickToggleNsfw.bind(this)}
          onKeyDown={this.onKeyDownMessage.bind(this)}
          onRemoveMediaFile={this.onRemoveMediaFile.bind(this)}
          onTextNodeLoaded={this.onTextNodeLoaded.bind(this)}
        />
      </div>
    )
  }

  renderTalkGroup(talkGroup: TalkBlock, prevTalkGroup: TalkBlock, nextTalkGroup: TalkBlock) {
    const model = new TalkGroupModel(this.props.me, talkGroup, prevTalkGroup, nextTalkGroup)
    const {key, isMyTalk, showName, showAvatar} = model
    const props = {
      isMyTalk,
      showName,
      showAvatar,
      talkGroup,
      onClickHashTag: this.onClickHashTag.bind(this),
      onClickMedia: this.onClickMedia.bind(this),
    }

    return <TalkGroup key={key} {...props} />
  }

  setUpMediaCounter() {
    this.mediaFileKeys = new WeakMap()
    this.mediaFileCounter = 0
  }

  sendMessage(message: string) {
    // get latest status id
    const {talk, token: {host}} = this.props
    let lastStatusId = null
    if(talk != null && talk.length) {
      const lastTalkGroup = talk[talk.length - 1]
      const lastStatus = lastTalkGroup.statuses[lastTalkGroup.statuses.length - 1]
      lastStatusId = lastStatus.getIdByHost(host)
    }

    this.setState({sendingMessage: true}, async () => {
      const {context} = this.context
      const {token, me, members, onPushLocalStatus} = this.props
      const {sensitive} = this.state
      let remover

      if(me != null) {
        remover = onPushLocalStatus(me.uri, message)
      }

      try {
        // TODO: SendDirectMessageUseCase SendTalkUseCaseに名前を変える?
        await context.useCase(new SendDirectMessageUseCase()).execute({
          token,
          self: me,
          message,
          mediaFiles: this.state.mediaFiles,
          in_reply_to_id: lastStatusId,
          recipients: Object.values(members),
          sensitive,
          onSendDirectMessageComplete: (postedStatuses: StatusRef[]) => {
            remover && remover(postedStatuses)
          },
        })
        this.setState({
          mediaFiles: [],
          newMessage: '',
          sendingMessage: false,
        }, () => {
          this.setUpMediaCounter()
        })
      } catch(e) {
        console.dir(e)
        this.setState({sendingMessage: false})
      }
    })
  }

  // cb

  onClickHeader() {
    const {column, onClickHeader} = this.props
    const node = findDOMNode(this)
    const scrollNode = findDOMNode(this.refs.talkGroups)

    if(node instanceof HTMLElement) {
      if(scrollNode && scrollNode instanceof HTMLElement) {
        onClickHeader(column, node, scrollNode)
      } else {
        onClickHeader(column, node, undefined)
      }
    }
  }

  onClickMenuButton(e: SyntheticEvent) {
    e.stopPropagation()
    this.setState({isMenuVisible: !this.state.isMenuVisible})
  }

  onScrollTalkGroups(e: SyntheticEvent) {
    // コードから変更された場合は何もしない
    if(this.scrollChanging) {
      this.scrollChanging = false
      return
    }

    const node = e.target

    if(node instanceof HTMLElement) {
      const atBottom = node.scrollTop + node.clientHeight >= node.scrollHeight ? true : false

      if(!atBottom && this.state.keepAtBottom)
        this.setState({keepAtBottom: false})
      else if(atBottom && !this.state.keepAtBottom)
        this.setState({keepAtBottom: true})
    }
  }

  onChangeMessage(e: SyntheticInputEvent) {
    this.setState({newMessage: e.target.value})
  }

  onChangeMediaFile(e: SyntheticInputEvent) {
    let files = Array.from(e.target.files)

    for(const file of files) {
      this.mediaFileKeys.set(file, ++this.mediaFileCounter)
    }

    this.setState(update(this.state, {mediaFiles: {$push: files}}))
  }

  onRemoveMediaFile(file: File) {
    const idx = this.state.mediaFiles.indexOf(file)
    if(idx >= 0) {
      const newState = update(this.state, {mediaFiles: {$splice: [[idx, 1]]}})
      this.setState({
        ...newState,
        sensitive: newState.mediaFiles.length === 0 ? false : newState.sensitive,
      })
    }
  }

  onClickToggleNsfw() {
    this.setState({
      sensitive: !this.state.sensitive,
    })
  }

  onKeyDownMessage(e: SyntheticKeyboardEvent) {
    require('assert')(!this.props.isLoading)

    if((e.ctrlKey || e.metaKey) && e.keyCode == KEY_ENTER) {
      e.preventDefault()

      const message = this.state.newMessage.trim()

      if(this.state.sendingMessage || !message) {
        return
      }

      this.clearMessage()
      this.sendMessage(message)
    }
  }

  onTextNodeLoaded(el: HTMLInputElement) {
    this.textNode = el
  }

  onClickHashTag(tag: string, e: SyntheticEvent) {
    e.preventDefault()
    this.props.onClickHashTag(tag)
  }

  onClickMedia(e: SyntheticEvent, mediaFiles: List<Attachment>, idx: number) {
    e.preventDefault()
    this.props.onClickMedia(mediaFiles, idx)
  }

  // private

  clearMessage() {
    if(this.textNode != null) {
      this.textNode.value = ''
    }
    this.setState({newMessage: ''})
  }
}
registerColumn(COLUMN_TALK, TalkColumn)
