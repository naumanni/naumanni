import React from 'react'

import {COLUMN_TALK} from 'src/constants'
import TimelineData from 'src/infra/TimelineData'
import {IconFont, NowLoading, UserIconWithHost} from 'src/pages/parts'
import AddColumnUseCase from 'src/usecases/AddColumnUseCase'
import UserDetail from 'src/pages/components/UserDetail'
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
    // TODO: stateにする
    const {tokens} = this.context.context.getState().tokenState
    const {account, relationships} = this.state
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
        <UserDetail
          account={account} tokens={tokens} relationships={relationships}
          onOpenTalkClicked={::this.onOpenTalkClicked}
          onToggleFollowClicked={::this.onToggleFollowClicked}
          />
        {this.renderTimeline()}
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
      if(relationships.length > 0) {
        const rel = relationships[0]
        this.setState({relationships: {...this.state.relationships, [token.account.acct]: rel}})
      }
    }))
  }

  close() {
    this.app.history.goTop()
  }

  onClickClose(e) {
    e.preventDefault()
    this.close()
  }

  onClickListTab(newList) {
    this.setState({list: newList})
  }

  onOpenTalkClicked(token, account, e) {
    const {context} = this.context

    context.useCase(new AddColumnUseCase()).execute(COLUMN_TALK, {
      to: this.state.account.acct,
      from: account.acct,
    })
      .then(() => this.close())
  }

  async onToggleFollowClicked(token, account, doFollow) {
    const {requester} = token
    const id = account.getIdByHost(token.host)
    let newRelationship
    let newAccount

    if(doFollow) {
      if(id) {
        newRelationship = await requester.followAccount({id: account.getIdByHost(token.host)})
      } else {
        newAccount = await requester.followRemoteAccount({uri: account.acct}, {token})
      }
    } else {
      require('assert')(id, 'account id required')
      newRelationship = await requester.unfollowAccount({id: account.getIdByHost(token.host)})
    }

    if(newRelationship) {
      this.setState({relationships: {
        ...this.state.relationships,
        [token.acct]: newRelationship},
      })
    }
  }
}
