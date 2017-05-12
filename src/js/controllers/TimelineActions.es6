import PropTypes from 'prop-types'

import {
  DIALOG_MEDIA_VIEWER,
} from 'src/constants'
import TimelineData, {postStatusManaged} from 'src/infra/TimelineData'
import PushDialogUseCase from 'src/usecases/PushDialogUseCase'


export const TimelineActionPropTypes = {
  // Accountがなんか押された
  onAvatarClicked: PropTypes.func.isRequired,
  // Reply送信ボタンが押された
  onSendReply: PropTypes.func.isRequired,
  // Fav/UnfavがClickされた
  onFavouriteStatus: PropTypes.func.isRequired,
  // Reblog/UnreblogがClickされた
  onReblogStatus: PropTypes.func.isRequired,
}


export default class TimelineActions {
  constructor({app, context}) {
    this.app = app
    this.context = context
  }

  get props() {
    return {
      onAvatarClicked: ::this.onAvatarClicked,
      onSendReply: ::this.onSendReply,
      onReblogStatus: ::this.onReblogStatus,
      onFavouriteStatus: ::this.onFavouriteStatus,
      onClickMedia: ::this.onClickMedia,
    }
  }

  onAvatarClicked(accountOrAcct, e) {
    e && e.preventDefault()

    const acct = typeof accountOrAcct === 'string' ? accountOrAcct : accountOrAcct.acct
    const {history} = this.app
    history.push(history.makeUrl('userDetail', {acct: `${acct}`}))
  }

  async onSendReply(status, sendFrom, messageContent) {
    // とりまこっから送る
    await Promise.all(
      sendFrom.map(async (token) => {
        // in_reply_to_id を付加する
        messageContent.message.in_reply_to_id = status.getIdByHost(token.host)
        // TODO: tootpanelの方にwarning出す?
        return await postStatusManaged(token, messageContent)
      })
    )
  }

  async onReblogStatus(token, status, toReblog) {
    const api = toReblog ? 'reblogStatus' : 'unreblogStatus'
    const {entities, result} = await token.requester[api]({
      id: status.getIdByHost(token.host),
    }, {token})
    return TimelineData.mergeStatuses(entities, [result])[0]
  }

  async onFavouriteStatus(token, status, toFav) {
    const api = toFav ? 'favouriteStatus' : 'unfavouriteStatus'
    const {entities, result} = await token.requester[api]({
      id: status.getIdByHost(token.host),
    }, {token})
    return TimelineData.mergeStatuses(entities, [result])[0]
  }

  onClickMedia(media) {
    this.context.useCase(
      new PushDialogUseCase()
    ).execute(DIALOG_MEDIA_VIEWER, {media})
  }
}
