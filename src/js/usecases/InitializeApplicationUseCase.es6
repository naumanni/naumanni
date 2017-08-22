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

    // プラグインを読み込む
    const pluginModulePaths = (require('naumanniPlugins') || {}).default
    if(pluginModulePaths) {
      await Promise.all(
        Object.keys(pluginModulePaths).map((pluginId) => {
          return loadPlugin(pluginId, pluginModulePaths[pluginId])
        })
      )
    }

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


// TODO: そのうち plugin.es6みたいなところにうつす
async function loadPlugin(pluginId, module) {
  const {default: initializer} = module
  const api = new PluginAPI()

  const uiColumns = require('naumanni/pages/uiColumns').getColumnClasses()
  const uiComponents = require('naumanni/pages/uiComponents')
  return initializer({
    api,
    uiColumns,
    uiComponents,
  })
}


import request from 'superagent'

import {getServerRoot} from 'src/config'


class PluginAPI {
  /**
   * pluginのAPIへの呼び出しを作成する
   * @param {string} method
   * @param {string} plugin
   * @param {string} api
   * @return {Request}
   */
  makePluginRequest(method, plugin, api) {
    if(!api.startsWith('/')) {
      throw new Error('api must starts with /')
    }

    // TODO: apply server authorization
    return request(method, `${getServerRoot()}api/plugins/${plugin}${api}`)
  }
}
