import PropTypes from 'prop-types'
import {Context} from 'almin'

import {Account, UIDialog} from 'src/models'


// almin
const ContextPropType = PropTypes.instanceOf(Context)
export {ContextPropType}


// naumanni
const AppPropType = PropTypes.any
const AccountPropType = PropTypes.instanceOf(Account)
export {AccountPropType, AppPropType}


// naumanni UI
const UIDialogPropType = PropTypes.instanceOf(UIDialog)
export {UIDialogPropType}
