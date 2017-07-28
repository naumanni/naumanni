// import update from 'immutability-helper'
import PropTypes from 'prop-types'
import React from 'react'
import TransitionGroup from 'react-transition-group/TransitionGroup'
import update from 'immutability-helper'
import {findDOMNode} from 'react-dom'
import {FormattedDate, FormattedMessage as _FM} from 'react-intl'
import classNames from 'classnames'
import {intlShape} from 'react-intl'

import {AppPropType, ContextPropType} from 'src/propTypes'
import {
  COLUMN_TAG,
  SUBJECT_MIXED, COLUMN_TALK, NOTIFICATION_TYPE_MENTION, VISIBLITY_DIRECT,
  KEY_ENTER} from 'src/constants'
import CloseColumnUseCase from 'src/usecases/CloseColumnUseCase'
import TimelineActions from 'src/controllers/TimelineActions'
import SendDirectMessageUseCase from 'src/usecases/SendDirectMessageUseCase'
import TalkListener from 'src/controllers/TalkListener'
import Column from './Column'
import {IconFont, NowLoading, UserIconWithHost, SafeContent} from '../parts'
import MediaFileThumbnail from 'src/pages/parts/MediaFileThumbnail'


/**
 * タイムラインのカラム
 */
export default class TalkColumn extends Column {
  listenerRemovers = []

  static contextTypes = {
    app: AppPropType,
    context: ContextPropType,
    intl: intlShape,
  }

  static propTypes = {
    to: PropTypes.string.isRequired,
    from: PropTypes.string.isRequired,
  }

  constructor(...args) {
    // mixed timeline not allowed
    require('assert')(args[0].subject !== SUBJECT_MIXED)
    super(...args)

    this.actionDelegate = new TimelineActions(this.context)
    this.listener = new TalkListener([this.props.to])
    // コードからスクロール量を変更している場合はtrue
    this.scrollChanging = false
    this.state = {
      ...this.state,
      keepAtBottom: true,
      loading: true,
      mediaFiles: [],
      menuVisible: false,
      newMessage: '',
      sendingMessage: false,
      sensitive: false,
    }
    this.setUpMediaCounter()
  }

  /**
   * @override
   */
  isPrivate() {
    return true
  }

  /**
   * @override
   */
  componentDidMount() {
    const {context} = this.context

    this.listenerRemovers.push(
      context.onChange(this.onChangeContext.bind(this)),
      this.listener.onChange(::this.onChangeTalk),
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

    clearInterval(this.timer)
    this.listener.close()
    delete this.listener
  }

  /**
   * @override
   */
  componentDidUpdate(prevProps, prevState) {
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
    const {loading, menuVisible} = this.state

    return (
      <div className="column">
        {this.renderHeader()}
        <TransitionGroup>
          {menuVisible && this.renderMenuContent()}
        </TransitionGroup>

        {loading
          ? <div className="column-body is-loading"><NowLoading /></div>
          : this.renderBody()
        }
      </div>
    )
  }

  // render private

  renderHeader() {
    let title = this.renderTitle()

    if(typeof title === 'string')
      title = <h1 className="column-headerTitle">{title}</h1>

    return (
      <header
        className={classNames(
          'column-header',
          {'column-header-private': this.isPrivate()}
        )}
        onClick={this.onClickHeader.bind(this)}
      >
        {title}
        <div className="column-headerMenu">
          <button className="column-headerMenuButton" onClick={this.onClickMenuButton.bind(this)}>
            <IconFont iconName="cog" />
          </button>
        </div>
      </header>
    )
  }

  renderTitle() {
    const {me, members} = this.state

    if(!me || !members) {
      return <_FM id="column.title.talk" />
    }

    const memberNames = Object.values(members).map((a) => a.display_name || a.acct)

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
    return <ColumnHeaderMenu onClickClose={this.onClickCloseColumn.bind(this)} />
  }

  renderBody() {
    const {formatMessage: _} = this.context.intl

    if(this.state.loading) {
      return <NowLoading />
    }

    const {loading, mediaFiles, sensitive, talk} = this.state

    return (
      <div className={classNames(
        'column-body',
        'column-body--talk',
        {'is-loading': loading},
      )}>
        <ul className="talk-talkGroups" ref="talkGroups" onScroll={::this.onScrollTalkGroups}>
          {(talk || []).map((talkGroup, idx, talk) => this.renderTalkGroup(talkGroup, talk[idx - 1], talk[idx + 1]))}
        </ul>
        <div className="talkForm-content">
          <div className="talkForm-status">
            <textarea
              value={this.state.newMessage}
              onChange={::this.onChangeMessage}
              onKeyDown={::this.onKeyDownMessage}
              placeholder={_({id: 'talk.form.placeholder'})} />
          </div>

          {this.renderMediaFiles()}

          <div className="talkForm-contentActions">
            <label className="tootForm-addMedia">
              <IconFont iconName="camera" />
              <input
                type="file"
                multiple="multiple"
                style={{display: 'none'}} ref="fileInput" onChange={::this.onChangeMediaFile} />
            </label>
            {mediaFiles.length > 0 &&
              <button
                className={classNames(
                  'tootForm-toggleNsfw',
                  {'is-active': sensitive},
                )}
                type="button"
                onClick={::this.onClickToggleNsfw}>
                <IconFont iconName="nsfw" />
              </button>
            }
          </div>
        </div>
      </div>
    )
  }

  /**
   * @override
   */
  getStateFromContext() {
    const state = super.getStateFromContext()
    state.token = state.tokenState.getTokenByAcct(this.props.from)
    return state
  }

  /**
   * @override
   */
  onChangeContext() {
    super.onChangeContext()

    this.listener.updateToken(this.state.token)
  }

  /**
   * @override
   */
  scrollNode() {
    return findDOMNode(this.refs.talkGroups)
  }

  renderTalkGroup(talkGroup, prevTalkGroup, nextTalkGroup) {
    const isMyTalk = talkGroup.account.isEqual(this.state.me)
    // memberのtalkgroupは、前のTalkGroupが自分であれば名前を表示しない
    const showName = !isMyTalk && !(prevTalkGroup && prevTalkGroup.account.isEqual(talkGroup.account))
    // memberのtalkgroupは、次のTalkGroupが自分であればアバターを表示しない
    const showAvatar = !isMyTalk && !(nextTalkGroup && nextTalkGroup.account.isEqual(talkGroup.account))

    const key = `speak-${talkGroup.account.acct}-${talkGroup.statuses[0].uri}`

    return (
      <div className={`talk-talkGroup ${isMyTalk ? 'is-me' : 'is-member'}`} key={key}>
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
          {talkGroup.contents.map(({key, parsedContent, createdAt, encrypted}) => {
            return (
              <li key={key}>
                <div className={`status-content ${encrypted ? 'is-encrypted' : ''}`}>
                  <SafeContent parsedContent={parsedContent} onClickHashTag={::this.onClickHashTag} />
                </div>
                <div className="status-date">
                  <FormattedDate value={createdAt.toDate()}
                    year="numeric" month="2-digit" day="2-digit"
                    hour="2-digit" minute="2-digit" second="2-digit"
                  />
                </div>
                {encrypted && <div className="status-isEncrypted"><IconFont iconName="lock" /></div>}
              </li>
            )
          })}
        </ul>
      </div>
    )
  }

  renderMediaFiles() {
    const {mediaFiles} = this.state

    if(!mediaFiles) {
      return null
    }

    return (
      <div className="talkForm-mediaFiles">
        {mediaFiles.map((file) => {
          return <MediaFileThumbnail
            key={this.mediaFileKeys.get(file)} mediaFile={file} showClose={true}
            onClose={this.onRemoveMediaFile.bind(this, file)} />
        })}
      </div>
    )
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

  onClickMenuButton(e) {
    e.stopPropagation()
    this.setState({menuVisible: !this.state.menuVisible})
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

  onScrollTalkGroups(e) {
    // コードから変更された場合は何もしない
    if(this.scrollChanging) {
      this.scrollChanging = false
      return
    }

    const node = e.target
    const atBottom = node.scrollTop + node.clientHeight >= node.scrollHeight ? true : false

    if(!atBottom && this.state.keepAtBottom)
      this.setState({keepAtBottom: false})
    else if(atBottom && !this.state.keepAtBottom)
      this.setState({keepAtBottom: true})
  }

  onChangeMessage(e) {
    this.setState({newMessage: e.target.value})
  }

  onChangeMediaFile(e) {
    let files = Array.from(e.target.files)

    for(const file of files) {
      this.mediaFileKeys.set(file, ++this.mediaFileCounter)
    }

    this.setState(update(this.state, {mediaFiles: {$push: files}}))
    e.target.value = null
  }

  onRemoveMediaFile(file) {
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

  onKeyDownMessage(e) {
    require('assert')(!this.state.loading)

    if((e.ctrlKey || e.metaKey) && e.keyCode == KEY_ENTER) {
      e.preventDefault()
      this.sendMessage()
    }
  }

  onClickHashTag(tag, e) {
    e.preventDefault()
    this.actionDelegate.onClickHashTag(tag)
  }
}
require('./').registerColumn(COLUMN_TALK, TalkColumn)
