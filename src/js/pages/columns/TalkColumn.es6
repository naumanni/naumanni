/* @flow */
import React from 'react'
import update from 'immutability-helper'
import {findDOMNode} from 'react-dom'
import {FormattedMessage as _FM} from 'react-intl'
import classNames from 'classnames'
import {intlShape} from 'react-intl'

import {ContextPropType} from 'src/propTypes'
import {
  COLUMN_TAG,
  SUBJECT_MIXED, COLUMN_TALK, NOTIFICATION_TYPE_MENTION, VISIBLITY_DIRECT,
  KEY_ENTER} from 'src/constants'
import {Account, OAuthToken, UIColumn} from 'src/models'
import CloseColumnUseCase from 'src/usecases/CloseColumnUseCase'
import TimelineActions from 'src/controllers/TimelineActions'
import SendDirectMessageUseCase from 'src/usecases/SendDirectMessageUseCase'
import TalkListener, {TalkBlock} from 'src/controllers/TalkListener'
import TalkGroup, {TalkGroupModel} from 'src/pages/components/TalkGroup'
import TalkForm from 'src/pages/components/TalkForm'
import {ColumnHeader, ColumnHeaderMenu, NowLoading} from '../parts'


export class TalkColumnModel {
  isLoading: boolean
  me: Account
  members: {[acct: string]: Account}
  talk: TalkBlock

  constructor(isLoading: boolean, me: Account, members: {[acct: string]: Account}, talk: TalkBlock) {
    this.isLoading = isLoading
    this.me = me
    this.members = members
    this.talk = talk
  }
}


type Props = {
  column: UIColumn,
  from: string,
  key: string,
  ref: string,
  to: string,
  onClickHeader: (string) => void,
}


type State = {
  token: OAuthToken,
  keepAtBottom: boolean,
  loading: boolean,
  me: Account,
  mediaFiles: File[],
  members: {[acct: string]: Account},
  isMenuVisible: boolean,
  newMessage: string,
  sendingMessage: boolean,
  sensitive: boolean,
  talk: TalkBlock[],
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

  actionDelegate: TimelineActions
  listener: TalkListener
  listenerRemovers = []
  mediaFileKeys: WeakMap<File, number>
  mediaFileCounter: number
  scrollChanging: boolean

  /**
   * @constructor
   */
  constructor(...args: any[]) {
    // mixed timeline not allowed
    require('assert')(args[0].subject !== SUBJECT_MIXED)
    super(...args)

    this.actionDelegate = new TimelineActions(this.context)
    this.listener = new TalkListener([this.props.to])
    // コードからスクロール量を変更している場合はtrue
    this.scrollChanging = false
    this.state = {
      ...this.getStateFromContext(),
      keepAtBottom: true,
      loading: true,
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
    const {context} = this.context

    this.listenerRemovers.push(
      context.onChange(this.onChangeContext.bind(this)),
      this.listener.onChange(this.onChangeTalk.bind(this)),
    )

    // make event listener
    this.listener.updateToken(this.state.token)
  }

  /**
   * @override
   */
  componentWillUnmount() {
    for(const remover of this.listenerRemovers) {
      remover()
    }

    this.listener.close()
    delete this.listener
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
    const {loading} = this.state

    return (
      <div className="column">
        <ColumnHeader
          canShowMenuContent={!loading}
          isPrivate={true}
          menuContent={this.renderMenuContent()}
          title={this.renderTitle()}
          onClickHeader={this.onClickHeader.bind(this)}
          onClickMenu={this.onClickMenuButton.bind(this)}
        />

        {loading
          ? <div className="column-body is-loading"><NowLoading /></div>
          : this.renderBody()
        }
      </div>
    )
  }

  // render private

  renderTitle() {
    const {me, members} = this.state

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
    return <ColumnHeaderMenu
      isCollapsed={!this.state.isMenuVisible}
      onClickClose={this.onClickCloseColumn.bind(this)} />
  }

  renderBody() {
    const {formatMessage: _} = this.context.intl

    if(this.state.loading) {
      return <NowLoading />
    }

    const {loading, mediaFiles, newMessage, sensitive, talk} = this.state

    return (
      <div className={classNames(
        'column-body',
        'column-body--talk',
        {'is-loading': loading},
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
        />
      </div>
    )
  }

  getStateFromContext() {
    const {context} = this.context
    const state = context.getState()

    state.token = state.tokenState.getTokenByAcct(this.props.from)

    return state
  }

  onChangeContext() {
    this.setState(this.getStateFromContext())
    this.listener.updateToken(this.state.token)
  }

  renderTalkGroup(talkGroup: TalkBlock, prevTalkGroup: TalkBlock, nextTalkGroup: TalkBlock) {
    const model = new TalkGroupModel(this.state.me, talkGroup, prevTalkGroup, nextTalkGroup)
    const {key, isMyTalk, showName, showAvatar} = model
    const props = {
      isMyTalk,
      showName,
      showAvatar,
      talkGroup,
      onClickHashTag: this.onClickHashTag.bind(this),
    }

    return <TalkGroup key={key} {...props} />
  }

  setUpMediaCounter() {
    this.mediaFileKeys = new WeakMap()
    this.mediaFileCounter = 0
  }

  sendMessage() {
    const message = this.state.newMessage.trim()
    if(!message) {
      // cannot send message
      return
    }

    // get latest status id
    let lastStatusId = null
    if(this.state.talk.length) {
      const lastTalkGroup = this.state.talk[this.state.talk.length - 1]
      const lastStatus = lastTalkGroup.statuses[lastTalkGroup.statuses.length - 1]
      lastStatusId = lastStatus.getIdByHost(this.state.token.host)
    }

    this.setState({sendingMessage: true}, async () => {
      const {context} = this.context
      const {sensitive, token, me, members} = this.state

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
    const node = findDOMNode(this)

    if(node instanceof HTMLElement) {
      const columnBounds = node.getBoundingClientRect()

      if(columnBounds.right > window.innerWidth || columnBounds.left < 0) {
        // if the column is out of the window, adjusts horizontal scroll
        this.props.onClickHeader(this.props.column.key)
      } else {
        // if the column is in the window, reset its scroll offset
        const scrollNode = findDOMNode(this.refs.talkGroups)
        if(scrollNode instanceof HTMLElement) {
          scrollNode.scrollTop = 0
        }
      }
    }
  }

  onClickMenuButton(e: SyntheticEvent) {
    e.stopPropagation()
    this.setState({isMenuVisible: !this.state.isMenuVisible})
  }

  onClickCloseColumn() {
    const {context} = this.context
    context.useCase(new CloseColumnUseCase()).execute(this.props.column)
  }

  onChangeTalk() {
    const {me, members, talk} = this.listener

    this.setState({
      me,
      members,
      talk,
      loading: this.listener.isLoading(),
    })
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
    require('assert')(!this.state.loading)

    if((e.ctrlKey || e.metaKey) && e.keyCode == KEY_ENTER) {
      e.preventDefault()
      this.sendMessage()
    }
  }

  onClickHashTag(tag: string, e: SyntheticEvent) {
    e.preventDefault()
    this.actionDelegate.onClickHashTag(tag)
  }
}
require('./').registerColumn(COLUMN_TALK, TalkColumn)
