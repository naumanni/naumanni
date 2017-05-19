import {StoreGroup} from 'almin'

import ColumnStore from './ColumnStore'
import DialogsStore from './DialogsStore'
import PreferenceStore from './PreferenceStore'
import TalkStore from './TalkStore'
import TokenStore from './TokenStore'

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
      new ColumnStore(),
      new DialogsStore(),
      new TalkStore(),
      new TokenStore(),
      new PreferenceStore(),
    ])
  }
}
