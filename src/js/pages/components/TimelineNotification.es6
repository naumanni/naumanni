import React from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage as _FM, FormattedRelative} from 'react-intl'

import {
  VISIBLITY_DIRECT, VISIBLITY_PRIVATE, VISIBLITY_UNLISTED, VISIBLITY_PUBLIC,
  NOTIFICATION_TYPE_MENTION, NOTIFICATION_TYPE_REBLOG, NOTIFICATION_TYPE_FAVOURITE, NOTIFICATION_TYPE_FOLLOW,
} from 'src/constants'
import {TimelineActionPropTypes} from 'src/controllers/TimelineActions'
import {NotificationRefPropType, OAuthTokenListPropType} from 'src/propTypes'
import {IconFont, UserIconWithHost, UserDisplayName, UserAcct, CushionString} from '../parts'
import TimelineStatus from './TimelineStatus'


// TODO: notificationRefと切り離してPureComponentにする
export default class TimelineNotification extends React.Component {
  static propTypes = {
    notificationRef: NotificationRefPropType.isRequired,
    tokens: OAuthTokenListPropType,
    onAvatarClicked: TimelineActionPropTypes.onAvatarClicked,
    onLockStatus: PropTypes.func,
  }

  /**
   * @constructor
   */
  constructor(...args) {
    super(...args)
  }

  /**
   * @override
   */
  render() {
    const {notificationRef} = this.props

    if(notificationRef.type === NOTIFICATION_TYPE_FOLLOW) {
      return this.renderFollow(notificationRef)
    } else if(notificationRef.type === NOTIFICATION_TYPE_MENTION) {
      return (
        <TimelineStatus
          {...notificationRef.statusRef.expand()}
          {...this.props}
        />
      )
    } else {
      return this.renderStatus(notificationRef)
    }
  }

  // NOTIFICATION_TYPE_FOLLOW
  renderFollow(notificationRef) {
    const account = notificationRef.accountRef.resolve()
    const {createdAt} = notificationRef
    const onClickAvatar = (e) => this.props.onAvatarClicked(account, e)

    return (
      <article className="notification notification--follow">
        <div className="notification-about">
          <span className="notification-icon">
            <IconFont iconName="user-plus" />
          </span>
          <span className="notification-what">
            <_FM id="notification.what.follow"
              values={{
                displayName: <UserDisplayName account={account} onClick={onClickAvatar} />,
              }} />
            <CushionString />
            <span
              className="notification-createdAt"
              alt={createdAt.toISOString()}>
              <FormattedRelative value={createdAt.toDate()} />
            </span>
          </span>
        </div>

        <div className="notification-account">
          <div className="notification-accountAvatar">
            <UserIconWithHost account={account} onClick={onClickAvatar} />
          </div>
          <div className="notification-accountInfo">
            <UserDisplayName account={account} onClick={onClickAvatar} />
            <UserAcct account={account} onClick={onClickAvatar} />
          </div>
        </div>
      </article>
    )
  }

  // NOTIFICATION_TYPE_MENTION, NOTIFICATION_TYPE_REBLOG, NOTIFICATION_TYPE_FAVOURITE
  renderStatus(notificationRef) {
    const account = notificationRef.accountRef.resolve()
    const {createdAt} = notificationRef
    let iconName = 'bell'
    const onClickAvatar = (e) => this.props.onAvatarClicked(account, e)

    switch(notificationRef.type) {
    case NOTIFICATION_TYPE_FAVOURITE:
      iconName = 'star-filled'
      break

    case NOTIFICATION_TYPE_REBLOG:
      iconName = 'reblog'
      break
    }

    return (
      <article className={`notification notification--${notificationRef.type}`}>
        <div className="notification-about">
          <span className="notification-icon">
            <IconFont iconName={iconName} />
          </span>
          <span className="notification-what">
            <_FM id={`notification.what.${notificationRef.type}`}
              values={{
                displayName: <UserDisplayName account={account} onClick={onClickAvatar} />,
              }} />
            <CushionString />
            <span
              className="notification-createdAt"
              alt={createdAt.format()}>
              <FormattedRelative value={createdAt.toDate()} />
            </span>
          </span>
        </div>

        <TimelineStatus
          modifier={notificationRef.type}
          onLockStatus={this.props.onLockStatus}
          {...notificationRef.statusRef.expand()}
          {...this.props}
        />
      </article>
    )
  }
}
