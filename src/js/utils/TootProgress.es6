import ChangeEventEmitter from 'src/utils/EventEmitter'


const TOTAL_RATIO = 100
const TOOT_RATIO = 5
const MEDIA_RATIO = TOTAL_RATIO - TOOT_RATIO

export default class TootProgress extends ChangeEventEmitter {
  mediaProgressMap = {}
  progress = 0
  status = ''
  intl = null

  constructor(context, sendFromTokens, mediaFiles) {
    super()
    this.intl = context.intl
    sendFromTokens.forEach(({acct}) => mediaFiles.forEach((file) => this.setMedia(acct, file)))
  }

  get mediaCount() {
    return Object.keys(this.mediaProgressMap).length
  }

  get mediaProgressUnit() {
    return MEDIA_RATIO / this.mediaCount
  }

  clean() {
    this.progress = 0
    this.status = ''
    this.mediaProgressMap = {}
  }

  genFileKey(acct, file) {
    return `${acct}::${file.name}:${file.size}`
  }

  setMedia(acct, file) {
    const key = this.genFileKey(acct, file)

    this.mediaProgressMap[key] = 0
  }

  updateMediaProgress(acct, file, percent) {
    const key = this.genFileKey(acct, file)

    this.mediaProgressMap[key] = percent * (this.mediaProgressUnit / TOTAL_RATIO)
    this.updateWholeMediaProgress()
  }

  updateWholeMediaProgress() {
    this.progress = Object.values(this.mediaProgressMap)
      .reduce((prev, progress) => prev + progress, 0)
    const currentMediaProgressUnit = Math.max(
      1,
      Math.min(this.mediaCount, Math.ceil(this.progress / this.mediaProgressUnit))
    )
    this.status = this.intl.formatMessage({id: 'toot_form.note.posting_media_files'}, {
      n: currentMediaProgressUnit,
    })

    this.emitChange()
  }

  updatePostProgress(percent) {
    this.status = this.intl.formatMessage({id: 'toot_form.note.posting_toot'})
    this.progress = this.mediaCount > 0
      ? MEDIA_RATIO + percent * (TOOT_RATIO / TOTAL_RATIO)
      : percent

    this.emitChange()
  }
}
