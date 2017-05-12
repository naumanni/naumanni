import ReplaceDialogsUseCase from 'src/usecases/ReplaceDialogsUseCase'
import {
  ACCT_PATTERN,
  DIALOG_ADD_ACCOUNT, DIALOG_AUTHORIZE_ACCOUNT, DIALOG_USER_DETAIL,
} from 'src/constants'


export default function installRoutes(history) {
  history.route('top', '/', routeTop)
  history.route('accountAdd', '/account/add', routeAccountAdd)
  history.route('authorize', '/authorize', routeAuthorize)
  history.route('userDetail', `/user/@:acct(${ACCT_PATTERN})`, routeUserDetail)
}


function routeTop(context, location, params, action) {
  context.useCase(new ReplaceDialogsUseCase())
    .execute([])
}

function routeAccountAdd(context, location, params, action) {
  context.useCase(new ReplaceDialogsUseCase())
    .execute([{type: DIALOG_ADD_ACCOUNT}])
}

function routeAuthorize(context, location, params, action) {
  context.useCase(new ReplaceDialogsUseCase())
    .execute([{type: DIALOG_AUTHORIZE_ACCOUNT}])
}

function routeUserDetail(context, location, params, action) {
  console.log('routeUserDetail')
  let {acct} = params

  context.useCase(new ReplaceDialogsUseCase())
    .execute([{type: DIALOG_USER_DETAIL, params: {acct: acct}}])
}
