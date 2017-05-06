import PropTypes from 'prop-types'
import {Context} from 'almin'

import {
  Account, OAuthToken,
  UIDialog
} from 'src/models'


// almin
const ContextPropType = PropTypes.instanceOf(Context)
export {ContextPropType}


// naumanni
const AppPropType = PropTypes.any
const AccountPropType = PropTypes.instanceOf(Account)
const OAuthTokenArrayPropType = PropTypes.arrayOf(PropTypes.instanceOf(OAuthToken))
export {AccountPropType, AppPropType, OAuthTokenArrayPropType}


// naumanni UI
const UIDialogPropType = PropTypes.instanceOf(UIDialog)
export {UIDialogPropType}
