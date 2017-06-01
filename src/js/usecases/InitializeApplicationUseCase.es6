import {UseCase} from 'almin'

import * as actions from 'src/actions'
import {STORAGE_KEY_PREFERENCES} from 'src/constants'
import LoadTokensUseCase from 'src/usecases/LoadTokensUseCase'
import initializeDatabase from 'src/infra'


export default class InitializeApplicationUseCase extends UseCase {
  /**
   * Applicationの最初の初期化
   * @param {func} cb
   */
  async execute() {
    await initializeDatabase()

    // とりまべた書き
    // Preferencesを読み込む
    let preferences = {}

    try {
      preferences = JSON.parse(localStorage.getItem(STORAGE_KEY_PREFERENCES)) || {}
    } catch(e) {
      preferences = {}
    }
    this.dispatch({
      type: actions.PREFERENCES_LOADED,
      preferences,
    })

    // Tokenを読み込む
    await this.context.useCase(new LoadTokensUseCase()).execute()
  }
}
