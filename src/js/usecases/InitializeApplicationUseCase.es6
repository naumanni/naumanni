import {UseCase} from 'almin'

import LoadTokensUseCase from 'src/usecases/LoadTokensUseCase'
import initializeDatabase from 'src/infra'


export default class InitializeApplicationUseCase extends UseCase {
  constructor() {
    super()
  }

  /**
   * Applicationの最初の初期化
   * @param {func} cb
   */
  async execute() {
    await initializeDatabase()
    await this.context.useCase(new LoadTokensUseCase()).execute()
  }
}
