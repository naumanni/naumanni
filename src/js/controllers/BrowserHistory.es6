import ReplaceDialogsUseCase from 'src/usecases/ReplaceDialogsUseCase'
import {DIALOG_ADD_ACCOUNT, DIALOG_AUTHORIZE_ACCOUNT} from 'src/constants'


/**
 * Historyのうまい使い方がわからず混乱気味
 */
export default class BrowserHistory {
  /**
   * @constructor
   * @param {Context} context almin context
   */
  constructor(context) {
    this.context = context
    window.onpopstate = ::this.onPopState
  }

  start() {
    this.onChangeState(document.location.pathname, null)
  }

  pushState(state, title, pathname) {
    history.pushState(state, title, pathname)
    this.onChangeState(pathname, state)
  }

  saveState(newState) {
    history.replaceState(newState, null, document.location.pathname)
  }

  back() {
    history.back()
  }

  // private
  onPopState(e) {
    console.log('onPopState: ' + document.location.pathname + ', state: ' + JSON.stringify(event.state))
    this.onChangeState(document.location.pathname, event.state)
  }

  onChangeState(pathname, state) {
    // TODO: routerを分離する
    switch(pathname) {
    case '/': (() => {
      this.context.useCase(new ReplaceDialogsUseCase())
        .execute([])
    })()
      break

    case '/account/add': (() => {
      this.context.useCase(new ReplaceDialogsUseCase())
        .execute([{type: DIALOG_ADD_ACCOUNT}])
    })()
      break

    case '/authorize': (() => {
      this.context.useCase(new ReplaceDialogsUseCase())
        .execute([{type: DIALOG_AUTHORIZE_ACCOUNT}])
    })()
      break

    default:
        // 404
      history.replaceState(null, null, '/')
      break
    }
  }
}
