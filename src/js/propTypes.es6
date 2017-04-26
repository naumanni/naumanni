import PropTypes from 'prop-types'
import {Context} from 'almin'

import {Account} from 'src/models'


// almin
const ContextPropType = PropTypes.instanceOf(Context)
export {ContextPropType}


// naumanni
const AccountPropType = PropTypes.instanceOf(Account)
export {AccountPropType}
