import {StoreGroup} from 'almin'

import Database from 'src/infra/Database'
import AccountsStore from './AccountsStore'

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
    ])
  }
}
