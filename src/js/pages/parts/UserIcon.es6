/* @flow */
import React from 'react'
import PropTypes from 'prop-types'
import {is} from 'immutable'

import {AccountPropType} from 'src/propTypes'
import {makeFaviconUrl} from 'src/utils'


type Props = {
  account: any,
  size: string,
  onClick: (e: SyntheticUIEvent) => void
};


/**
 * ユーザーの顔アイコン with ホスト
 */
export class UserIconWithHost extends React.Component<void, Props, void> {
  static propTypes = {
    account: AccountPropType.isRequired,
    size: PropTypes.string,
  }

  // propsの中でrendering対象のkey
  static propDeepKeys = {
    'account': new Set(['acct', 'avatar', 'avatar_static']),
  }

  /**
   * @override
   */
  shouldComponentUpdate(nextProps: Props, nextState: void) {
    return (
      this.props.size === nextProps.size &&
      is(this.props.account, nextProps.account)
    ) ? false : true
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
        <img className="userIcon-host" src={makeFaviconUrl(account.instance)} />
      </span>
    )
  }
}
