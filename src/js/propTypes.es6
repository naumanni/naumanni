import PropTypes from 'prop-types'
import {Context} from 'almin'

import {
  Account, OAuthToken, /* Status,*/
  UIDialog,
} from 'src/models'


// almin
const ContextPropType = PropTypes.instanceOf(Context)
export {ContextPropType}


// naumanni
const AppPropType = PropTypes.any
const AccountPropType = PropTypes.instanceOf(Account)
const OAuthTokenArrayPropType = PropTypes.arrayOf(PropTypes.instanceOf(OAuthToken))
// ProxyなObjectをinstanceOfしたい...???
// const StatusLikePropType = PropTypes.oneOfType([
//   PropTypes.instanceOf(Status),
//   PropTypes.instanceOf(Proxy),
// ])
const StatusLikePropType = PropTypes.any
const AccountLikePropType = PropTypes.any
export {AccountPropType, AccountLikePropType, AppPropType, OAuthTokenArrayPropType, StatusLikePropType}


// naumanni UI
const UIDialogPropType = PropTypes.instanceOf(UIDialog)
export {UIDialogPropType}
