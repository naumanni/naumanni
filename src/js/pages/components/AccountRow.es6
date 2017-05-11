import React from 'react'
import PropTypes from 'prop-types'

import {AccountPropType} from 'src/propTypes'
import {IconFont, UserIconWithHost, SafeNote} from '../parts'


export default class AccountRow extends React.Component {
  static propTypes = {
    account: AccountPropType.isRequired,
    onClick: PropTypes.func,
  }
  /**
   * @override
   */
  render() {
    const {account, onClick} = this.props

    return (
      <article className="accountRow" onClick={() => onClick && onClick(account)}>
        <div className="accountRow-avatar">
          <UserIconWithHost account={account} />
        </div>
        <div className="accountRow-info">
          <div className="accountRow-author">
            {account.hasPublicKey && <span className="user-hasPulbickey"><IconFont iconName="key" /></span>}

            <span className="user-displayName">{account.display_name || account.username}</span>
            <span className="user-account">@{account.acct}</span>
          </div>

          <div className="accountRow-note"><SafeNote parsedNote={account.parsedNote} /></div>

        </div>
      </article>
    )
  }
}
