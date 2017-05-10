import ReplaceDialogsUseCase from 'src/usecases/ReplaceDialogsUseCase'
import {DIALOG_ADD_ACCOUNT, DIALOG_AUTHORIZE_ACCOUNT, DIALOG_USER_DETAIL} from 'src/constants'


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

  goTop() {
    history.pushState({}, null, '/')
    this.onChangeState('/', {})
  }

  // private
  onPopState(e) {
    console.log('onPopState: ' + document.location.pathname + ', state: ' + JSON.stringify(event.state))
    this.onChangeState(document.location.pathname, event.state)
  }

  onChangeState(pathname, state) {
    // TODO: routerを分離する
    const {context} = this
    const PATH_USER = /user\/@([^/]+)/

    if(pathname === '/') {
      context.useCase(new ReplaceDialogsUseCase())
        .execute([])
    } else if(pathname === '/account/add') {
      context.useCase(new ReplaceDialogsUseCase())
        .execute([{type: DIALOG_ADD_ACCOUNT}])
    } else if(pathname === '/authorize') {
      context.useCase(new ReplaceDialogsUseCase())
        .execute([{type: DIALOG_AUTHORIZE_ACCOUNT}])
    } else if(PATH_USER.test(pathname)) {
      const match = pathname.match(PATH_USER)
      context.useCase(new ReplaceDialogsUseCase())
        .execute([{type: DIALOG_USER_DETAIL, params: {acct: match[1]}}])
    } else {
      // 404
      console.error('invalid url', pathname)
      history.replaceState(null, null, '/')
    }
  }
}
