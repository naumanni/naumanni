import React from 'react'
import PropTypes from 'prop-types'

import {AccountPropType} from 'src/propTypes'
import {IconFont, UserIconWithHost, SafeNote, UserDisplayName, UserAcct} from '../parts'
import {TimelineActionPropTypes} from 'src/controllers/TimelineActions'


export default class AccountRow extends React.Component {
  static propTypes = {
    account: AccountPropType.isRequired,
    onClick: PropTypes.func,
    onAvatarClicked: TimelineActionPropTypes.onAvatarClicked,
  }
  /**
   * @override
   */
  render() {
    const {account, onClick} = this.props
    const onClickAvatar = (e) => this.props.onAvatarClicked(account, e)

    return (
      <article className="accountRow" onClick={(e) => onClick && onClick(account, e)}>
        <div className="accountRow-avatar">
          <UserIconWithHost account={account} onClick={onClickAvatar} />
        </div>
        <div className="accountRow-info">
          <div className="accountRow-author">
            {account.hasPublicKey && <span className="user-hasPulbickey"><IconFont iconName="key" /></span>}

            {account.display_name && <UserDisplayName account={account} onClick={onClickAvatar} />}
            <UserAcct account={account} onClick={onClickAvatar} />
          </div>

          <div className="accountRow-note"><SafeNote parsedNote={account.parsedNote} /></div>

        </div>
      </article>
    )
  }
}
