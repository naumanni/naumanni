import PropTypes from 'prop-types'

import {
  COLUMN_TAG,
  DIALOG_MEDIA_VIEWER,
  SUBJECT_MIXED,
} from 'src/constants'
import TimelineData, {postStatusManaged} from 'src/infra/TimelineData'
import AddColumnUseCase from 'src/usecases/AddColumnUseCase'
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
      onClickHashTag: ::this.onClickHashTag,
    }
  }

  onAvatarClicked(accountOrAcct, e) {
    e && e.preventDefault()
    e && e.stopPropagation()

    const acct = typeof accountOrAcct === 'string' ? accountOrAcct : accountOrAcct.acct
    const {history} = this.app
    history.push(history.makeUrl('userDetail', {acct: `${acct}`}))
  }

  async onSendReply(status, sendFrom, messageContent) {
    // とりまこっから送る
    await Promise.all(
      sendFrom.map(async (token) => {
        // in_reply_to_id を付加する
        let inReplyToId = status.getIdByHost(token.host)
        if(!inReplyToId) {
          status = await this.resolveStatus(token, status)
          if(status)
            inReplyToId = status.getIdByHost(token.host)
        }
        messageContent.message.in_reply_to_id = inReplyToId

        // TODO: tootpanelの方にwarning出す?
        return await postStatusManaged(token, messageContent)
      })
    )
  }

  async onReblogStatus(token, status, toReblog) {
    const api = toReblog ? 'reblogStatus' : 'unreblogStatus'

    if(!status.getIdByHost(token.host)) {
      status = await this.resolveStatus(token, status)
      if(!status)
        throw new Error('status not found')
    }

    const {entities, result} = await token.requester[api]({
      id: status.getIdByHost(token.host),
    }, {token})
    return TimelineData.mergeStatuses(entities, [result])[0]
  }

  async onFavouriteStatus(token, status, toFav) {
    const api = toFav ? 'favouriteStatus' : 'unfavouriteStatus'

    if(!status.getIdByHost(token.host)) {
      status = await this.resolveStatus(token, status)
      if(!status)
        throw new Error('status not found')
    }

    const {entities, result} = await token.requester[api]({
      id: status.getIdByHost(token.host),
    }, {token})
    return TimelineData.mergeStatuses(entities, [result])[0]
  }

  onClickMedia(mediaList, idx) {
    this.context.useCase(
      new PushDialogUseCase()
    ).execute(DIALOG_MEDIA_VIEWER, {mediaList, initialIdx: idx})
  }

  onClickHashTag(tag) {
    this.context.useCase(new AddColumnUseCase()).execute(COLUMN_TAG, {
      subject: SUBJECT_MIXED,
      tag,
    })
  }

  /**
   * tokenのHostでのidを得るために、statusを検索する
   * @param {OAuthToken} token
   * @param {Status} status
   * @return {Status}
   */
  async resolveStatus(token, status) {
    const {entities} = await token.requester.search({q: status.url, resolve: 'true'})
    if(!entities.statuses || !entities.statuses[status.uri])
      return null
    return entities.statuses[status.uri]
  }
}
