import React from 'react'
import PropTypes from 'prop-types'

import {ContextPropType} from 'src/propTypes'
import {IconFont, UserIconWithHost} from 'src/pages/parts'


/**
 * ダッシュボードのヘッダ
 * [logo] [toot欄] [account icon] [account icon] [account icon] [account icon] .... [歯車]
 */
export default class DashboardHeader extends React.Component {
  static contextTypes = {
    context: ContextPropType,
  }

  /**
   * @constructor
   */
  constructor(...args) {
    super(...args)

    this.state = this.getStateFromContext()
  }

  /**
   * @override
   */
  componentDidMount() {
    // update accounts
    const {context} = this.context

    this.listenerRemovers = [
      context.onChange(() => this.setState(this.getStateFromContext())),
    ]
  }

  /**
   * @override
   */
  componentWillUnmount() {
    for(const remover of this.listenerRemovers) {
      remover()
    }
  }

  /**
   * @override
   */
  render() {
    const {accountsState} = this.state
    const {tokensAndAccounts} = accountsState

    return (
      <header className="naumanniDashboard-header">
        <img className="naumanniDashboard-header-logo" src="/static/images/naumanni-headerLogo.svg" />

        <div className="naumanniDashboard-header-toot">
          <input type="text" placeholder="何してますか？忙しいですか？手伝ってもらってもいいですか？" />
        </div>

        <ul className="naumanniDashboard-header-accounts">
          {tokensAndAccounts.map((ta) => this.renderTokenAndAccount(ta))}
          <li>
            <button className="naumanniDashboard-header-addAccountButton">
              <IconFont iconName="plus" />
            </button>
          </li>
        </ul>

        <span className="naumanniDashboard-header-spacer" />

        <button className="naumanniDashboard-header-configButton">
          <IconFont iconName="cog" />
        </button>

      </header>
    )
  }

  /**
   * ヘッダに顔アイコンを書くよ
   * @return {React.Component}
   */
  renderTokenAndAccount({token, account}) {
    if(!account) {
      return (
        <li key={token.address}>
          <div className="naumanniDashboard-header-noAccount">?</div>
        </li>
      )
    }

    return (
      <li key={token.address}>
        <UserIconWithHost account={account} />
      </li>
    )
/*
    return (
      <li key={token.address}>
        {account.display_name} / {account.host}<br />

        <div>
          <span style={{margin: '0 1em'}}>
            <Link to={`/account/${account.address}/home`}>ホーム</Link>
          </span>
          <span style={{margin: '0 1em'}}>
            <Link to={`/account/${account.address}/local`}>ローカルタイムライン</Link>
          </span>
          <span style={{margin: '0 1em'}}>
            <Link to={`/account/${account.address}/federation`}>連合タイムライン</Link>
          </span>
        </div>

        <div>
          {account.hasPublicKey ? (
            <span>
              🔑あり
              <button onClick={this.onClickGenerateKeypair.bind(this, token, account)}>鍵ペア再生成</button>
            </span>
          ) : (
            <span>
              🔑なし
              <button onClick={this.onClickGenerateKeypair.bind(this, token, account)}>鍵ペア生成</button>
            </span>
          )}

        </div>
      </li>
    )
*/
  }

  getStateFromContext() {
    const {accountsState} = this.context.context.getState()
    return {
      accountsState,
    }
  }

}
