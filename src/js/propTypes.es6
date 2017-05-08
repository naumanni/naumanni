import PropTypes from 'prop-types'
import {Context} from 'almin'

import {
  Account, OAuthToken, Status,
  UIDialog,
} from 'src/models'


// almin
const ContextPropType = PropTypes.instanceOf(Context)
export {ContextPropType}


// naumanni
const AppPropType = PropTypes.any
const AccountPropType = PropTypes.instanceOf(Account)
const OAuthTokenArrayPropType = PropTypes.arrayOf(PropTypes.instanceOf(OAuthToken))
const StatusPropType = PropTypes.instanceOf(Status)
export {AccountPropType, AppPropType, OAuthTokenArrayPropType, StatusPropType}


// naumanni UI
const UIDialogPropType = PropTypes.instanceOf(UIDialog)
export {UIDialogPropType}
