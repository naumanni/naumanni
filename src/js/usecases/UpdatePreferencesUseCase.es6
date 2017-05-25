import {UseCase} from 'almin'

import * as actions from 'src/actions'
import {STORAGE_KEY_PREFERENCES} from 'src/constants'


export default class UpdatePreferencesUseCase extends UseCase {
  async execute(newPreferences) {
    this.dispatch({
      type: actions.PREFERENCES_UPDATED,
      preferences: newPreferences,
    })

    localStorage.setItem(
      STORAGE_KEY_PREFERENCES,
      JSON.stringify(newPreferences)
    )
  }
}
