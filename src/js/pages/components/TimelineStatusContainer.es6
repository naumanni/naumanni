import React from 'react'

import {AccountPropType, StatusPropType} from 'src/propTypes'
import {TimelineStatus, UserDisplayName} from 'src/pages/uiComponents'
import {isKeys} from 'src/utils'

/**
 * Reblogはここで吸収
 * @return {React.Component}
 */
export default class TimelineStatusContainer extends React.Component {
  static propTypes = {
    reblog: StatusPropType,
    reblogAccount: AccountPropType,
    ...TimelineStatus.propTypes,
  }

  /**
   * @override
   */
  shouldComponentUpdate(nextProps, nextState) {
    let {reblog, reblogAccount, ...prevProps} = this.props

    if(reblog) {
      const prevAcount = prevProps.account
      const nextAccount = nextProps.account
      prevProps = {
        ...prevProps,
        status: reblog,
        account: reblogAccount,
      }
      nextProps = {
        ...nextProps,
        status: nextProps.reblog,
        account: nextProps.reblogAccount,
      }

      if(!isKeys(UserDisplayName.propDeepKeys.account, prevAcount, nextAccount)) {
        return true
      }
    }

    return this.refs.timelineStatus
      ? this.refs.timelineStatus.shouldComponentUpdate(nextProps, nextState)
      : true
  }

  /**
   * @override
   */
  render() {
    let {reblog, reblogAccount, ...props} = this.props
    let children = null

    if(reblog || reblogAccount) {
      const {
        IconFont, UserDisplayName,
      } = require('../uiComponents')
      require('assert')(reblog && reblogAccount)
      const account = props.account
      props = {
        ...props,
        status: reblog,
        account: reblogAccount,
      }

      children = (
        <div className="status-row status-reblogFrom">
          <div className="status-rowLeft">
            <IconFont iconName="reblog" />
          </div>
          <div className="status-rowRight">
            <UserDisplayName
              account={account}
              onClick={(e) => {
                e.preventDefault()
                props.onAvatarClicked(account)
              }} /> boosted
          </div>
        </div>
      )
    }

    const {TimelineStatus} = require('src/pages/uiComponents')

    return (
      <TimelineStatus ref="timelineStatus" {...props}>{children}</TimelineStatus>
    )
  }
}
