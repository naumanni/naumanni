/* @flow */
import {UseCase} from 'almin'

import * as actions from 'src/actions'

/**
 * カラムをswapするUsecase
 */
export default class SwapColumnUseCase extends UseCase {
  constructor() {
    super()
  }

  async execute(from: number, to: number) {
    this.dispatch({
      type: actions.COLUMN_SWAP_REQUESTED,
      from,
      to,
    })
  }
}
