import PropTypes from 'prop-types'
import {Context} from 'almin'

import {
  Account, Notification, OAuthToken, Status,
  UIDialog,
} from 'src/models'
import {
  NotificationRef,
} from 'src/infra/TimelineData'

// almin
const ContextPropType = PropTypes.instanceOf(Context)
export {ContextPropType}


// naumanni
const AcctPropType = PropTypes.string
const AppPropType = PropTypes.any
const AccountPropType = PropTypes.instanceOf(Account)
const NotificationPropType = PropTypes.instanceOf(Notification)
const OAuthTokenArrayPropType = PropTypes.arrayOf(PropTypes.instanceOf(OAuthToken))
const StatusPropType = PropTypes.instanceOf(Status)
export {AcctPropType, AccountPropType, AppPropType, NotificationPropType, OAuthTokenArrayPropType, StatusPropType}

const NotificationRefPropType = PropTypes.instanceOf(NotificationRef)
export {NotificationRefPropType}

// naumanni UI
const UIDialogPropType = PropTypes.instanceOf(UIDialog)
export {UIDialogPropType}
