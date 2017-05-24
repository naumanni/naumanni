import PropTypes from 'prop-types'
import ImmutablePropTypes from 'react-immutable-proptypes'
import {Context} from 'almin'

import {
  ACCT_REX,
} from 'src/constants'
import {
  Account, Notification, OAuthToken, Status, Attachment,
  UIDialog,
} from 'src/models'
import {
  NotificationRef,
} from 'src/infra/TimelineData'

// almin
const ContextPropType = PropTypes.instanceOf(Context)
export {ContextPropType}


// naumanni
const AcctPropTypeBase = function(isRequired, props, propName, componentName) {
  if(!isRequired && !props[propName])
    return

  if(!ACCT_REX.test(props[propName])) {
    return new Error(
      'Invalid prop `' + propName + '` supplied to' +
      ' `' + componentName + '`. Validation failed.'
    )
  }
}
const AcctPropType = AcctPropTypeBase.bind(null, false)
AcctPropType.isRequired = AcctPropTypeBase.bind(null, true)

const AppPropType = PropTypes.any
const AccountPropType = PropTypes.instanceOf(Account)
const NotificationPropType = PropTypes.instanceOf(Notification)
const StatusPropType = PropTypes.instanceOf(Status)
export {AcctPropType, AccountPropType, AppPropType, NotificationPropType, StatusPropType}

export const AttachmentListPropType = ImmutablePropTypes.iterableOf(PropTypes.instanceOf(Attachment))
export const OAuthTokenListPropType = ImmutablePropTypes.iterableOf(PropTypes.instanceOf(OAuthToken))

const NotificationRefPropType = PropTypes.instanceOf(NotificationRef)
export {NotificationRefPropType}

// naumanni UI
const UIDialogPropType = PropTypes.instanceOf(UIDialog)
export {UIDialogPropType}
