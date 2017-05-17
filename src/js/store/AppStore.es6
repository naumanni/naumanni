import {StoreGroup} from 'almin'

import TokenStore from './TokenStore'
import ColumnStore from './ColumnStore'
import DialogsStore from './DialogsStore'
import TalkStore from './TalkStore'

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
      new TokenStore(),
      new ColumnStore(),
      new DialogsStore(),
      new TalkStore(),
    ])
  }
}
