// import update from 'immutability-helper'
import PropTypes from 'prop-types'
import React from 'react'

import {
  SUBJECT_MIXED, COLUMN_TALK, NOTIFICATION_TYPE_MENTION, VISIBLITY_DIRECT,
  KEY_ENTER} from 'src/constants'
import Column from './Column'
import {IconFont, UserIconWithHost} from '../parts'
import SendDirectMessageUseCase from 'src/usecases/SendDirectMessageUseCase'

/**
 * タイムラインのカラム
 */
export default class TalkColumn extends Column {
  static propTypes = {
    to: PropTypes.string.isRequired,
    from: PropTypes.string.isRequired,
  }

  constructor(...args) {
    // mixed timeline not allowed
    require('assert')(args[0].subject !== SUBJECT_MIXED)
    super(...args)

    this.listener = new TalkListener(this.props.to)
    this.state.loading = true
    this.state.newMessage = ''
  }

  /**
   * @override
   */
  componentDidMount() {
    super.componentDidMount()

    this.listenerRemovers.push(
      this.listener.onChange(::this.onChangeTalk),
    )

    // make event listener
    this.listener.open(this.state)
  }

  /**
   * @override
   */
  componentWillUnmount() {
    super.componentWillUnmount()

    clearInterval(this.timer)
  }

  /**
   * @override
   */
  renderTitle() {
    const {fromAccount, toAccount} = this.state

    if(!toAccount || !fromAccount) {
      return 'トーク'
    }

    return (
      <h1 className="column-headerTitle">
        <div className="column-headerTitleSub">{fromAccount.account}</div>
        <div className="column-headerTitleMain">{toAccount.display_name || toAccount.acct}とトーク</div>
      </h1>
    )
  }

  /**
   * @override
   */
  renderBody() {
    if(this.state.loading) {
      return <NowLoading />
    }

    const {talk} = this.state

    return (
      <div className="talk">
        <ul className="talk-speaks">
          {talk.map((statusGroup) => this.renderStatusGroup(statusGroup))}
        </ul>
        <div className="talk-form">
          <textarea
            value={this.state.newMessage}
            onChange={::this.onChangeMessage}
            onKeyDown={::this.onKeyDownMessage}
            placeholder="なんか入力してShift+Enter" />
        </div>
      </div>
    )
  }

  /**
   * @override
   */
  getStateFromContext() {
    const state = super.getStateFromContext()
    const fromTA = state.accountsState.getAccountByAddress(this.props.from)

    state.token = fromTA && fromTA.token
    state.fromAccount = fromTA && fromTA.account

    return state
  }

  /**
   * @override
   */
  onChangeConext() {
    super.onChangeConext()

    this.listener.updateTokenAndAccount(this.state)
  }

  renderStatusGroup(statusGroup) {
    const {speaker, statuses} = statusGroup
    const isReceiver = speaker.address == this.state.fromAccount.address
    const key = `speak-${speaker.address}-${statuses[0].status.id}`

    return (
      <div className={`talk-speak ${isReceiver ? 'is-receiver' : 'is-sender'}`} key={key}>
        {isReceiver && (
          <div className="talk-speaker">
            <UserIconWithHost account={speaker} />
          </div>
        )}
        <ul className="talk-speakStatuses">
          {statuses.map((entry) => {
            const {status} = entry
            return (
              <div key={status.id} className="status-content" dangerouslySetInnerHTML={{__html: status.content}} />
            )
          })}
        </ul>
      </div>
    )
  }

  // cb
  onChangeTalk() {
    this.setState({
      toAccount: this.listener.toAccount,
      talk: this.listener.talk,
      loading: this.listener.talk === null ? true : false,
    })
  }

  onChangeMessage(e) {
    this.setState({newMessage: e.target.value})
  }

  onKeyDownMessage(e) {
    const message = this.state.newMessage.trim()
    if(e.shiftKey && e.keyCode == KEY_ENTER && message.length) {
      console.log('send message', message)

      e.preventDefault()

      const {context} = this.context
      context.useCase(new SendDirectMessageUseCase()).execute(
        this.state.token, message, this.state.toAccount)

      this.setState({
        newMessage: '',
      }, () => {
        console.log(this.state)
      })
    }
  }
}


//
import {EventEmitter} from 'events'


class UIStatusGroup {
  constructor(speaker) {
    this.speaker = speaker
    this.statuses = []
  }

  pushStatus(status) {
    this.statuses.push(status)
  }
}


/**
 * とりまゴリゴリ書いてみる
 */
class TalkListener extends EventEmitter {
  static EVENT_CHANGE = 'EVENT_CHANGE'

  constructor(toAcct) {
    super()
    this.token = null
    this.fromAccount = null  // reader

    this.toAcct = toAcct
    this.toAccount = null  // sender

    this._acquiringNotifications = false
    this._acquiringMyTalks = false

    this.statuses = []
    this.talk = null
  }

  get sender() {
    return this.toAccount
  }

  get receiver() {
    return this.fromAccount
  }

  open({token, fromAccount}) {
    this.token = token
    this.fromAccount = fromAccount

    this.refresh()
  }

  updateTokenAndAccount({token, fromAccount}) {
    this.token = token
    this.fromAccount = fromAccount

    this.refresh()
  }

  async refresh() {
    // まだ自分が何者かわかってない
    if(!(this.token && this.fromAccount))
      return

    const {requester} = this.token

    // toAccountがなければ取りに行く
    if(!this.toAccount) {
      const toAccounts = await requester.searchAccount({q: this.toAcct, limit: 1})

      if(toAccounts.length == 0)
        return
      // 複数ってなんだ？
      require('assert')(toAccounts.length == 1)
      this.toAccount = toAccounts[0]
      this.emitChange()
    }

    // 現状 Talkを取るAPIが無い。 notifiationsとかを辿るしかない
    if(!this._acquiringNotifications) {
      this.accquireNotifications()
    }

    if(!this._acquiringMyTalks) {
      this.accquireMyTalks()
    }
  }

  /**
   * 相手からの発言を探す
   */
  async accquireNotifications() {
    const {requester} = this.token
    this._acquiringNotifications = true

    try {
      let maxId = undefined
      for(;;) {
        let changed = false

        const notifications = await requester.listNotifications({limit: 30, max_id: maxId})
        if(!notifications.length)
          break

        for(const noty of notifications) {
          if(noty.type === NOTIFICATION_TYPE_MENTION &&
             noty.status.visibility === VISIBLITY_DIRECT &&
             noty.account.acct === this.toAcct) {
            if(this.pushStatus(noty.status))
              changed = true
          }
        }

        maxId = notifications[notifications.length - 1].id

        if(changed)
          this.emitChange()
      }
    } finally {
      this._acquiringNotifications = false
    }
  }

  async accquireMyTalks() {
    const {requester} = this.token
    this._acquiringMyTalks = true

    try {
      let maxId = undefined
      for(;;) {
        let changed = false

        const statuses = await requester.listStatuses({id: this.fromAccount.id, limit: 40, max_id: maxId})
        if(!statuses.length)
          break

        for(const st of statuses) {
          if(st.visibility === VISIBLITY_DIRECT && st.isMentionTo(this.toAcct)) {
            if(this.pushStatus(st))
              changed = true
          }
        }

        maxId = statuses[statuses.length - 1].id

        if(changed)
          this.emitChange()
      }
    } finally {
      this._acquiringMyTalks = false
    }
  }

  pushStatus(status) {
    // TODO:富豪的
    let old = this.statuses.find((e) => e.status.id === status.id)
    if(old)
      return false

    const {UITimelineEntry} = require('src/models')
    const {TimelineEntry, decryptStatus} = require('src/controllers/TimelineListener')
    const entry = new TimelineEntry(status)

    // 今のところ他人から送られたStatusだけ復号
    if(status.hasEncryptedStatus && this.sender.isEqual(status.account)) {
      decryptStatus(this.receiver, status)
        .then((decryptedText) => {
          debugger
          entry.decryptedText = decryptedText
          this.emitChange()
        }, (error) => console.error('decrypt failed >', error)
        )
    }

    this.statuses.push(entry)
    this.statuses.sort(TimelineEntry.compareReversed)

    // rebuild talk
    let statusGroup = null
    let talk = []
    for(const entry of this.statuses) {
      const st = entry.status
      if(!statusGroup || statusGroup.speaker.address !== st.account.address) {
        statusGroup = new UIStatusGroup(st.account)
        talk.push(statusGroup)
      }

      // statusGroup.pushStatus(new UITimelineEntry(entry))
      statusGroup.pushStatus(entry)
    }
    this.talk = talk

    return true
  }

  onChange(cb) {
    this.on(this.EVENT_CHANGE, cb)
    return this.removeListener.bind(this, this.EVENT_CHANGE, cb)
  }

  emitChange() {
    this.emit(this.EVENT_CHANGE, [this])
  }
}
