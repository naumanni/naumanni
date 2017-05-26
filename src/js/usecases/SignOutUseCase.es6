import {UseCase} from 'almin'

import {COLUMN_TALK} from 'src/constants'
import CloseColumnUseCase from 'src/usecases/CloseColumnUseCase'
import DeleteTokenUseCase from 'src/usecases/DeleteTokenUseCase'


export default class SignOutUseCase extends UseCase {
  constructor() {
    super()
  }

  /**
   * @param {OAuthToken} token
   * @param {UIColumn[]} columns
   */
  async execute(token, columns) {
    const {host} = token
    const rex = new RegExp(`.+?${host}$`)

    await Promise.all(
      columns
        .filter((c) => {
          // depends on column.params implementation
          const target = c.type === COLUMN_TALK ? c.params.from : c.params.subject

          if(!target) {
            console.error(`Unknown column type:${c.type} for getting token related info`)
            return false
          }

          return rex.exec(target) !== null
        })
        .map((c) => this.context.useCase(new CloseColumnUseCase()).execute(c))
    )
    await this.context.useCase(new DeleteTokenUseCase()).execute(token)
  }
}
