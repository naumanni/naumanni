import React from 'react'

import {
  VISIBLITY_DIRECT, VISIBLITY_PRIVATE, VISIBLITY_UNLISTED, VISIBLITY_PUBLIC,
  NOTIFICATION_TYPE_MENTION, NOTIFICATION_TYPE_REBLOG, NOTIFICATION_TYPE_FAVOURITE, NOTIFICATION_TYPE_FOLLOW,
} from 'src/constants'
import {IconFont, UserIconWithHost} from '../parts'
import TimelineStatus from './TimelineStatus'
import TootPanel from './TootPanel'
import {NotificationRefPropType} from 'src/propTypes'


// TODO: notificationRefと切り離してPureComponentにする
export default class TimelineNotification extends React.Component {
  static propTypes = {
    notificationRef: NotificationRefPropType.isRequired,
    tokens: TootPanel.propTypes.tokens,
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
    const relativeTime = createdAt.fromNow()
    const onClickHandler = this.onClickAccount.bind(this, account)

    return (
      <article className="notification notification--follow">
        <div className="notification-about">
          <span className="notification-icon">
            <IconFont iconName="user-plus" />
          </span>
          <span className="notification-what">
            <UserDisplayName account={account} onClick={onClickHandler} /> {'さんにフォローされました '}
            <CushionString length={relativeTime.length} />
            <span
              className="notification-createdAt"
              alt={createdAt.format()}>
              {relativeTime}
            </span>
          </span>
        </div>

        <div className="notification-account">
          <div className="notification-accountAvatar">
            <UserIconWithHost account={account} onClick={onClickHandler} />
          </div>
          <div className="notification-accountInfo">
            <UserDisplayName account={account} onClick={onClickHandler} />
            <UserAcct account={account} onClick={onClickHandler} />
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
    let what = notificationRef.type
    const relativeTime = createdAt.fromNow()

    switch(notificationRef.type) {
    case NOTIFICATION_TYPE_FAVOURITE:
      iconName = 'star-filled'
      what = '%username%さんがあなたのトゥートをお気に入りに登録しました'
      break

    case NOTIFICATION_TYPE_REBLOG:
      iconName = 'reblog'
      what = '%username%さんがあなたのトゥートをブーストしました'
      break
    }
    what += ' '

    return (
      <article className={`notification notification--${notificationRef.type}`}>
        <div className="notification-about">
          <span className="notification-icon">
            <IconFont iconName={iconName} />
          </span>
          <span className="notification-what">
            <UserDisplayName account={account} /> {what.replace('%username%', '')}
            <CushionString length={relativeTime.length} />
            <span
              className="notification-createdAt"
              alt={createdAt.format()}>
              {relativeTime}
            </span>
          </span>
        </div>

        <TimelineStatus
          modifier={notificationRef.type}
          {...notificationRef.statusRef.expand()}
          {...this.props}
        />
      </article>
    )
  }

  onClickAccount(account) {
    this.props.onAvatarClicked(account)
  }
}


function UserLink({account, className, children}) {
  return <a className={className} href={account.url} target="_blank">{children}</a>
}

function UserDisplayName({account}) {
  return <UserLink account={account} className="user-displayName">{account.displayName}</UserLink>
}

function UserAcct({account}) {
  return <UserLink account={account} className="user-acct">@{account.acct}</UserLink>
}

function CushionString({length}) {
  const nbsp = String.fromCharCode(0xA0)
  return <span className="cushionString">{new Array(length).fill(nbsp).join('')}</span>
}
