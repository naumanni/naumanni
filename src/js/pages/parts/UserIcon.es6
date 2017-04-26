import React from 'react'

import {AccountPropType} from 'src/propTypes'

/**
 * ユーザーの顔アイコン with ホスト
 */
export class UserIconWithHost extends React.Component {
  static propTypes = {
    account: AccountPropType.isRequired,
  }

  /**
   * @override
   */
  render() {
    const {account} = this.props

    return (
      <span className="userIcon with-host">
        <img className="userIcon-avatar" src={account.avatar} alt={account.address} title={account.address} />
        <img className="userIcon-host" src={`https://${account.host}/favicon.ico`} />
      </span>
    )
  }
}
