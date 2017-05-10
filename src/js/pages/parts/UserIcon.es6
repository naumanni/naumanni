import React from 'react'
import PropTypes from 'prop-types'

import {AccountPropType} from 'src/propTypes'

/**
 * ユーザーの顔アイコン with ホスト
 */
export class UserIconWithHost extends React.Component {
  static propTypes = {
    account: AccountPropType.isRequired,
    size: PropTypes.string,
  }

  /**
   * @override
   */
  render() {
    const {account, size} = this.props
    let className = 'userIcon with-host'

    if(size)
      className += ` size-${size}`

    return (
      <span className={className} onClick={this.props.onClick}>
        <img
          className="userIcon-avatar" src={account.safeAvatar || '/images/no-avatar.png'}
          alt={account.acct} title={account.acct} />
        <img className="userIcon-host" src={`https://${account.instance}/favicon.ico`} />
      </span>
    )
  }
}
