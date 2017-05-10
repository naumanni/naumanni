import React from 'react'

import {COLUMN_TALK} from 'src/constants'
import TimelineData from 'src/infra/TimelineData'
import {DropdownMenuButton, IconFont, NowLoading, UserIconWithHost} from 'src/pages/parts'
import AddColumnUseCase from 'src/usecases/AddColumnUseCase'
import Dialog from './Dialog'

export const LIST_STATUSES = 'statuses'
export const LIST_FOLLOWINGS = 'followings'
export const LIST_FOLLOWERS = 'followers'


/**
 * ユーザー詳細表示
 */
export default class UserDetailDialog extends Dialog {
  /**
   * @constructor
   */
  constructor(...args) {
    super(...args)

    this.state = {
      ...this.state,
      account: null,
      list: LIST_STATUSES,
      relationships: {},
    }
  }

  /**
   * @override
   */
  componentDidMount() {
    super.componentDidMount()

    this.start()
  }

  /**
   * @override
   */
  render() {
    const {account} = this.state
    const closeButton = (
      <button className="dialog-closeButton" onClick={::this.onClickClose}><IconFont iconName="cancel" /></button>
    )

    if(!account) {
      return (
        <div className={this.dialogClassName}>
          {closeButton}
          <NowLoading />
        </div>
      )
    }

    return (
      <div className={this.dialogClassName}>
        {closeButton}
        {this.renderAccountDetail()}
        {this.renderTimeline()}
      </div>
    )
  }

  renderAccountDetail() {
    const {account} = this.state
    const headerStyle = {}

    if(account.header && account.header.startsWith('http'))
      headerStyle.background = `url(${account.header}) center center, rgba(255, 255, 255, 0.5)`

    return (
      <div className="userDetail" style={headerStyle}>
        <div className="userDetail-actions">
          <DropdownMenuButton onRenderMenu={::this.onRenderTalkMenu}>
            <button className="button"><IconFont iconName="talk" /> トーク</button>
          </DropdownMenuButton>
          <DropdownMenuButton onRenderMenu={::this.onRenderFollowMenu}>
            <button className="button button--primary"><IconFont iconName="user-plus" /> フォロー</button>
          </DropdownMenuButton>
        </div>

        <div className="userDetail-header">
          <UserIconWithHost account={account} size="large" />
          <div>{account.user_name}</div>
          <div>{account.acct}</div>
          <div><SafeLink href={account.url} target="_blank">{account.url}</SafeLink></div>
          <div><SafeNote note={account.note} /></div>
        </div>
      </div>
    )
  }

  renderTimeline() {
    const {account} = this.state
    const {list} = this.state

    const _renderCount = (type, label, count) => {
      return (
        <div
          className={`userTimeline-count userTimeline-count--${type} ${list === type ? 'is-active' : ''}`}
          onClick={this.onClickListTab.bind(this, type)}
        >
          <span className="userTimeline-countLabel">{label}</span>
          <span className="userTimeline-countNumber">{count}</span>
       </div>
      )
    }

    return (
      <div className="userTimeline">

        <div className="userTimeline-counts">
          {_renderCount(LIST_STATUSES, '投稿', account.statuses_count)}
          {_renderCount(LIST_FOLLOWINGS, 'フォロー中', account.following_count)}
          {_renderCount(LIST_FOLLOWERS, 'フォロワー', account.followers_count)}
        </div>

        {list === LIST_STATUSES && this.renderStatuses()}
        {list === LIST_FOLLOWINGS && this.renderFollowings()}
        {list === LIST_FOLLOWERS && this.renderFollowers()}

      </div>
    )
  }

  renderStatuses() {
    return <NowLoading />
  }

  renderFollowings() {
    return <NowLoading />
  }

  renderFollowers() {
    return <NowLoading />
  }

  /**
   * @private
   * @return {string}
   */
  get dialogClassName() {
    return super.dialogClassName + ' dialog--userDetail'
  }

  /**
   * ユーザー情報を取得する
   */
  async start() {
    // 全Tokenからとってみる
    const {acct} = this.props
    // TODO: tokensをstate（かprops)にする
    const tokens = this.context.context.getState().tokenState.tokens
    let account = null

    // idが欲しい
    await Promise.all(tokens.map(async (token) => {
      const {entities, result} = await token.requester.searchAccount({q: acct})
      const accounts = result.map((r) => entities.accounts[r])
      const fetched = accounts.find((a) => a.acct === acct)

      if(!fetched)
        return

      // // 自ホスト優先, 新しい方優先
      // if(!this.state.account || fetched.instance === token.host ||
      //    this.state.account.createdAt.isBefore(fetched.createdAt))
      //   account = fetched
      if(!this.state.account)
        account = fetched
      else
        account = account.checkMerge(fetched).merged
      this.setState({account})

      // get relationships
      const relationships = await token.requester.getRelationships({id: account.getIdByHost(token.host)})
      console.log(relationships)
      if(relationships.length > 0) {
        const rel = relationships[0]
        this.setState({relationships: {...this.state.relationships, [token.account.acct]: rel}})
      }
    }))
  }

  close() {
    this.app.history.goTop()
  }

  onRenderTalkMenu() {
    const tokens = this.context.context.getState().tokenState.tokens

    return (
      <ul className="menu menu--talk">
        {tokens.map((token) => {
          const {account} = token
          return (
            <li className="menu-item"
              key={account.acct}
              onClick={this.onClickOpenTalk.bind(this, token, account)}
            >
              <UserIconWithHost account={account} size="mini" /> {account.acct}
            </li>
          )
        })}
      </ul>
    )
  }

  onRenderFollowMenu() {
    const tokens = this.context.context.getState().tokenState.tokens

    return (
      <ul className="menu menu--follow">
        {tokens.map((token) => {
          const {account} = token
          const relationship = this.state.relationships[account.acct]
          const isFollowing = relationship ? relationship.following : false
          const isRequested = relationship ? relationship.requested : false

          let text

          if(isFollowing)
            text = 'フォローを解除'
          else
            text = 'フォローする'

          return (
            <li className="menu-item"
              key={account.acct}
              onClick={this.onClickToggleFollow.bind(this, token, account)}
            >
              <IconFont iconName={isFollowing ? 'user-times' : 'user-plus'} />
              <UserIconWithHost account={account} size="mini" />
              <span className="menu-itemLabel">
                {account.acct}<br />{text}
              </span>
            </li>
          )
        })}
      </ul>
    )
  }

  onClickClose(e) {
    e.preventDefault()
    this.close()
  }

  onClickListTab(newList) {
    this.setState({list: newList})
  }

  onClickOpenTalk(token, account, e) {
    const {context} = this.context

    context.useCase(new AddColumnUseCase()).execute(COLUMN_TALK, {
      to: this.state.account.acct,
      from: account.acct,
    })
      .then(() => this.close())
  }

  onClickToggleFollow(token, account, e) {
    const relationship = this.state.relationships[account.acct]
    const isFollowing = relationship ? relationship.following : false
    const isRequested = relationship ? relationship.requested : false
  }
}


export function SafeLink({children, href, ...props}) {
  if(!(href.startsWith('http://') || href.startsWith('https://')))
    href = 'javascript:void(0)'

  return (
    <a href={href} {...props}>{children}</a>
  )
}


export function SafeNote({note}) {
  const sanitizeHtml = require('sanitize-html')

  note = sanitizeHtml(note, {allowedTags: []})
  return <p>{note}</p>
}
