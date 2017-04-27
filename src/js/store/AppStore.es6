import {StoreGroup} from 'almin'

import AccountsStore from './AccountsStore'
import ColumnStore from './ColumnStore'
import DialogsStore from './DialogsStore'

/**
 * 全Storeを纏める
 */
export default class AppStoreGroup {
  /**
   * factory
   * @return {AppStoreGroup}
   */
  static create() {
    return new StoreGroup([
      new AccountsStore(),
      new ColumnStore(),
      new DialogsStore(),
    ])
  }
}
