import React from 'react'
import {FormattedMessage as _FM} from 'react-intl'

import {COLUMN_TALK, AUTO_PAGING_MARGIN} from 'src/constants'
import TimelineActions from 'src/controllers/TimelineActions'
import {AccountTimelineLoader} from 'src/controllers/TimelineLoader'
import TimelineData from 'src/infra/TimelineData'
import {StatusTimeline} from 'src/models/Timeline'
import AccountRow from 'src/pages/components/AccountRow'
import UserDetail from 'src/pages/components/UserDetail'
import TimelineStatus from 'src/pages/components/TimelineStatus'
import {IconFont, NowLoading} from 'src/pages/parts'
import {AcctPropType} from 'src/propTypes'
import AddColumnUseCase from 'src/usecases/AddColumnUseCase'
import {HistoryBaseDialog} from './Dialog'

export const LIST_STATUSES = 'statuses'
export const LIST_FOLLOWINGS = 'followings'
export const LIST_FOLLOWERS = 'followers'


/**
 * ユーザー詳細表示
 */
export default class UserDetailDialog extends HistoryBaseDialog {
  static propTypes = {
    acct: AcctPropType.isRequired,
  }
  /**
   * @constructor
   */
  constructor(...args) {
    super(...args)

    const {tokens} = this.context.context.getState().tokenState

    this.state = {
      ...this.state,
      account: null,
      list: LIST_STATUSES,
      relationships: {},
      timeline: null,
      // TODO: Contextの更新をチェックする
      tokens,
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
          onToggleMuteClicked={::this.onToggleMuteClicked}
          onToggleBlockClicked={::this.onToggleBlockClicked}
          onClickReport={::this.onClickReport}
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
    const {account, list, primaryToken} = this.state

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

        {primaryToken && account && primaryToken.host !== account.instance && (
          <div className="userTimeline-warning">
            <_FM id="user_detail.warning.not_latest_data" />
          </div>
        )}

        <div className="userTimeline-counts">
          {_renderCount(LIST_STATUSES, <_FM id="user_detail_dialog.label.statuses" />, account.statuses_count)}
          {_renderCount(LIST_FOLLOWINGS, <_FM id="user_detail_dialog.label.followings" />, account.following_count)}
          {_renderCount(LIST_FOLLOWERS, <_FM id="user_detail_dialog.label.followers" />, account.followers_count)}
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
    let {tokens} = this.state
    let recommendedToken  // 一番statusCountの多い情報を持っているサーバのToken
    let account = null

    // idが欲しい
    await Promise.all(tokens.map(async (token) => {
      const {entities, result} = await token.requester.searchAccount({q: acct})
      const accounts = result.map((r) => entities.accounts[r])
      const fetched = accounts.find((a) => a.acct === acct)

      if(!fetched)
        return

      // 自ホスト優先, statuses_countが多い方優先
      if(!account) {
        account = fetched
        recommendedToken = token
      } else if(fetched.instance === token.host || fetched.statuses_count > account.statuses_count) {
        account = account.checkMerge(fetched).merged
        recommendedToken = token
      } else {
        account = fetched.checkMerge(account).merged
      }

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

    // primaryTokenを決める
    let acctHost = acct.split('@')[1]

    // acctと同ホストのTokenがあればそれを使う.
    let primaryToken = tokens.find((t) => t.host === acctHost) || recommendedToken

    this.setState({
      account: account,
      primaryToken,
    })

    this.startLoadList(this.state.list, primaryToken)
  }

  async startLoadList(list, primaryToken) {
    const {account} = this.state

    if(!primaryToken)
      primaryToken = this.state.primaryToken

    if(list === LIST_STATUSES) {
      if(!this.timelineLoader) {
        this.timelineLoader = new AccountTimelineLoader(account, this.timeline, primaryToken, this.db)
      }

      this.isLoadingTimeline = true
      this.setState({timelineIsLoading: true})
      this.timelineLoader.loadInitial()
        .then(() => {
          this.isLoadingTimeline = false
          this.setState({timelineIsLoading: false})
        }, () => {
          this.isLoadingTimeline = false
          this.setState({timelineIsLoading: false})
        })
    } else {
      const endpoint = list === LIST_FOLLOWERS ? 'listFollowers' : 'listFollowings'
      const accounts = new Map()

      const id = account.getIdByHost(primaryToken.host)
      if(!id)
        return

      let nextUrl

      for(;;) {
        let response
        try {
          response = await primaryToken.requester[endpoint]({id, limit: 80}, {endpoint: nextUrl})
        } catch(e) {
          // おそらく404とか
          return
        }
        const {entities, result, link} = response
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

      if(list === LIST_FOLLOWERS)
        this.setState({followers: Array.from(accounts.values())})
      else
        this.setState({followings: Array.from(accounts.values())})
    }
  }

  loadMoreStatuses() {
    if(!this.isLoadingTimeline && !this.timelineLoader.isTailReached()) {
      this.isLoadingTimeline = true
      this.setState({tailLoading: true})
      this.timelineLoader.loadNext()
        .then(() => {
          this.isLoadingTimeline = false
          this.setState({tailLoading: false})
        }, () => {
          this.isLoadingTimeline = false
          this.setState({tailLoading: false})
        })
    }
  }

  async toggleRelationship(token, account, relationshipMethod) {
    const newRelationship = await this.actionDelegate.toggleRelationship(token, account, relationshipMethod)

    if(newRelationship) {
      this.setState({relationships: {
        ...this.state.relationships,
        [token.acct]: newRelationship},
      })
    }
  }

  onClickListTab(newList) {
    this.setState({list: newList})
    this.loadingAccount.then(() => this.startLoadList(newList))
  }

  onToggleMuteClicked(token, account, doMute) {
    const {requester: {muteAccount, unmuteAccount}} = token
    const relationshipMethod = doMute ? muteAccount : unmuteAccount

    this.toggleRelationship(token, account, relationshipMethod)
  }

  onToggleBlockClicked(token, account, doBlock) {
    const {requester: {blockAccount, unblockAccount}} = token
    const relationshipMethod = doBlock ? blockAccount : unblockAccount

    this.toggleRelationship(token, account, relationshipMethod)
  }

  onClickReport(token, account) {
    // TODO:
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
    const {acct} = account
    const {requester} = token
    let id = account.getIdByHost(token.host)
    let newRelationship

    if(!id) {
      // idがないので取得
      const {entities, result} = await requester.searchAccount({q: acct})
      const accounts = result.map((r) => entities.accounts[r])
      const fetched = accounts.find((a) => a.acct === acct)

      if(fetched) {
        account = account.checkMerge(fetched).merged
        console.log('after', account.toJSON())
        id = account.getIdByHost(token.host)
      }
    }

    if(doFollow) {
      if(id) {
        newRelationship = (await requester.followAccount({id: account.getIdByHost(token.host)})).result
      } else {
        await requester.followRemoteAccount({uri: acct}, {token})
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
}
