import React from 'react'

import {COLUMN_TALK, AUTO_PAGING_MARGIN} from 'src/constants'
import TimelineData from 'src/infra/TimelineData'
import {IconFont, NowLoading} from 'src/pages/parts'
import AddColumnUseCase from 'src/usecases/AddColumnUseCase'
import UserDetail from 'src/pages/components/UserDetail'
import {AccountTimelineLoader} from 'src/controllers/TimelineLoader'
import TimelineActions from 'src/controllers/TimelineActions'
import TimelineStatus from 'src/pages/components/TimelineStatus'
import AccountRow from 'src/pages/components/AccountRow'
import {HistoryRelatedDialog} from './Dialog'
import {StatusTimeline} from 'src/models/Timeline'

export const LIST_STATUSES = 'statuses'
export const LIST_FOLLOWINGS = 'followings'
export const LIST_FOLLOWERS = 'followers'


/**
 * ユーザー詳細表示
 */
export default class UserDetailDialog extends HistoryRelatedDialog {
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
      timeline: null,
      // TODO: Contextの更新をチェックする
      tokens: this.context.context.getState().tokenState.tokens,
    }

    this.actionDelegate = new TimelineActions(this.context)
    this.db = TimelineData
    this.timeline = new StatusTimeline()
  }

  /**
   * @override
   */
  componentDidMount() {
    super.componentDidMount()

    this.listenerRemovers.push(
      this.timeline.onChange(::this.onTimelineChanged),
      this.db.registerTimeline(this.timeline),
    )

    // set timer for update dates
    this.timer = setInterval(
      () => this.setState({tick: (new Date())}),
      30 * 1000)

    this.loadingAccount = this.start()
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
  render() {
    // TODO: stateにする
    const {account, relationships, tokens} = this.state
    const closeButton = (
      <button className="dialog-button dialog-button--close" onClick={::this.onClickClose}>
        <IconFont iconName="cancel" />
      </button>
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

  /**
   * @override
   * @private
   * @return {string}
   */
  get dialogClassName() {
    return super.dialogClassName + ' dialog--userDetail'
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
    const {timeline, tokens, timelineIsLoading} = this.state

    if(!timeline)
      return <NowLoading />

    return (
      <ul className="timeline" onScroll={::this.onScrollTimeline}>
        {timeline.map((statusRef) => {
          return (
            <li key={statusRef.uri}>
              <TimelineStatus
                subject={null}
                tokens={tokens}
                {...statusRef.expand()}
                {...this.actionDelegate.props}
              />
            </li>
          )
        })}
        {timelineIsLoading && <li className="timeline-loading"><NowLoading /></li>}
      </ul>
    )
  }

  renderFollowings() {
    const {followings} = this.state

    if(!followings)
      return <NowLoading />

    return this.renderAccounts(followings)
  }

  renderFollowers() {
    const {followers} = this.state

    if(!followers)
      return <NowLoading />

    return this.renderAccounts(followers)
  }

  renderAccounts(accounts) {
    // TODO: 絞込付きFriendListを使ったほうが良いのでは
    const onClickHandler = ::this.actionDelegate.onAvatarClicked

    return (
      <ul className="accountList">
        {accounts.map((account) => (
          <li key={account.acct}>
            <AccountRow
              account={account}
              onAvatarClicked={onClickHandler}
              onClick={onClickHandler}
            />
          </li>
        ))}
      </ul>
    )
  }

  /**
   * ユーザー情報を取得する
   */
  async start() {
    // 全Tokenからとってみる
    const {acct} = this.props
    const {tokens} = this.state
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

      // めっちゃキモいけど手っ取り早い...
      const setStateWaiter = new Promise((resolve, reject) => {
        this.setState({account}, () => resolve())
      })

      // get relationships
      const {result: relationships} = await token.requester.getRelationships({id: account.getIdByHost(token.host)})
      if(relationships.length > 0) {
        const rel = relationships[0]
        this.setState({relationships: {...this.state.relationships, [token.account.acct]: rel}})
      }

      await setStateWaiter
    }))

    this.startLoadList(this.state.list)
  }

  async startLoadList(list) {
    const {account, tokens} = this.state

    if(list === LIST_STATUSES) {
      if(!this.timelineLoaders) {
        this.timelineLoaders = tokens
          .map((token) => new AccountTimelineLoader(account, this.timeline, token, this.db))
          .map((loader) => {
            return {loader, loading: false}
          })
      }

      for(const loaderInfo of this.timelineLoaders) {
        loaderInfo.loading = true
        loaderInfo.loader.loadInitial()
          .then(() => {
            loaderInfo.loading = false
            this.setState({timelineIsLoading: this._isListLoading()})
          }, () => {
            loaderInfo.loading = false
            this.setState({timelineIsLoading: this._isListLoading()})
          })
      }
      this.setState({timelineIsLoading: this._isListLoading()})
    } else {
      const endpoint = list === LIST_FOLLOWERS ? 'listFollowers' : 'listFollowings'
      const accounts = new Map()

      await Promise.all(
        tokens.map(async (token) => {
          const id = account.getIdByHost(token.host)
          if(!id)
            return

          let nextUrl

          for(;;) {
            const {entities, result, link} = await token.requester[endpoint]({id, limit: 80}, {endpoint: nextUrl})
            if(!accounts)
              break

            // TODO: mergeする
            result
              .map((uri) => entities.accounts[uri])
              .reduce((a, accounts) => a.concat(accounts), [])
              .forEach((acc) => accounts.set(acc.uri, acc))

            nextUrl = link && link.next
            if(!nextUrl)
              break
          }
        })
      )

      if(list === LIST_FOLLOWERS)
        this.setState({followers: Array.from(accounts.values())})
      else
        this.setState({followings: Array.from(accounts.values())})
    }
  }

  loadMoreStatuses() {
    for(const loaderInfo of Object.values(this.timelineLoaders)) {
      if(!loaderInfo.loading && !loaderInfo.loader.isTailReached()) {
        loaderInfo.loading = true
        loaderInfo.loader.loadNext()
          .then(() => {
            loaderInfo.loading = false
            this.setState({timelineIsLoading: this._isListLoading()})
          }, () => {
            loaderInfo.loading = false
            this.setState({timelineIsLoading: this._isListLoading()})
          })
      }
    }
    this.setState({tailLoading: this._isListLoading()})
  }

  onClickListTab(newList) {
    this.setState({list: newList})
    this.loadingAccount.then(() => this.startLoadList(newList))
  }

  onOpenTalkClicked(token, account, e) {
    const {context} = this.context

    context.useCase(new AddColumnUseCase()).execute(COLUMN_TALK, {
      to: this.state.account.acct,
      from: token.acct,
    })
      .then(() => {
        this.app.history.replace(this.app.history.makeUrl('top'))
      })
  }

  async onToggleFollowClicked(token, account, doFollow) {
    const {requester} = token
    const id = account.getIdByHost(token.host)
    let newRelationship

    if(doFollow) {
      if(id) {
        newRelationship = (await requester.followAccount({id: account.getIdByHost(token.host)})).result
      } else {
        // Detail表示している時点でAccountはもってるのだから、ここには来ないのでは?
        await requester.followRemoteAccount({uri: account.acct}, {token})
      }
    } else {
      require('assert')(id, 'account id required')
      newRelationship = (await requester.unfollowAccount({id: account.getIdByHost(token.host)})).result
    }

    if(newRelationship) {
      this.setState({relationships: {
        ...this.state.relationships,
        [token.acct]: newRelationship},
      })
    }
  }

  onTimelineChanged() {
    this.setState({
      loading: false,
      timeline: this.timeline.timeline,
    })
  }

  onScrollTimeline(e) {
    const node = e.target

    // Scroll位置がBottomまであとちょっとになれば、次を読み込む
    if(node.scrollTop + node.clientHeight > node.scrollHeight - AUTO_PAGING_MARGIN) {
      //
      if(!this.state.timelineIsLoading) {
        this.loadMoreStatuses()
      }
    }
  }

  _isListLoading() {
    return !Object.values(this.timelineLoaders).every((loaderInfo) => !loaderInfo.loading)
  }
}
