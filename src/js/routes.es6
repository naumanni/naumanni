import ReplaceDialogsUseCase from 'src/usecases/ReplaceDialogsUseCase'
import {
  ACCT_PATTERN,
  DIALOG_ADD_ACCOUNT, DIALOG_AUTHORIZE_ACCOUNT, DIALOG_USER_DETAIL, DIALOG_GLOBAL_PREFERENCES,
} from 'src/constants'
import {parseQuery} from 'src/utils'


export default function installRoutes(history) {
  history.route('top', '/', routeTop)
  history.route('accountAdd', '/account/add', routeAccountAdd)
  history.route('authorize', '/authorize', routeAuthorize)
  history.route('userDetail', `/user/@:acct(${ACCT_PATTERN})`, routeUserDetail)
  history.route('preferences', '/preferences', routePreferences)
}


function routeTop(history, location, params, action) {
  history.context.useCase(new ReplaceDialogsUseCase())
    .execute([])

  if(history.useHash) {
    // authorizeのredirect backで何かクエリがあるかも
    const realUrl = new URL(window.location)
    if(realUrl.searchParams.get('action') === 'authorize') {
      const host = realUrl.searchParams.get('host')
      const code = realUrl.searchParams.get('code')
      const encoder = encodeURIComponent
      realUrl.hash = ''
      window.history.replaceState({}, '', '/')
      setTimeout(() => {
        const authorizeUrl = history.makeUrl('authorize') + `?host=${encoder(host)}&code=${encoder(code)}`
        history.replace(authorizeUrl)
      })
    }
  }
}

function routeAccountAdd(history, location, params, action) {
  history.context.useCase(new ReplaceDialogsUseCase())
    .execute([{type: DIALOG_ADD_ACCOUNT}])
}

function routeAuthorize(history, location, params, action) {
  let {code, host} = parseQuery(location.search)

  history.context.useCase(new ReplaceDialogsUseCase())
    .execute([{type: DIALOG_AUTHORIZE_ACCOUNT, params: {code, host}}])
}

function routeUserDetail(history, location, params, action) {
  let {acct} = params

  history.context.useCase(new ReplaceDialogsUseCase())
    .execute([{type: DIALOG_USER_DETAIL, params: {acct: acct}}])
}

function routePreferences(history, location, params, action) {
  history.context.useCase(new ReplaceDialogsUseCase())
    .execute([{type: DIALOG_GLOBAL_PREFERENCES}])
}
