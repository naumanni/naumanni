export default class UITimelineEntry {
  constructor(entry) {
    this.entry = entry
    this.isContentOpen = false
  }

  get mainStatus() {
    const status = this.entry.status
    if(status.reblog)
      return status.reblog
    return status
  }

  isReblogged() {
    return this.entry.status.reblog ? true : false
  }

  /*
   * ReblogしたUser
   */
  get rebloggedUser() {
    return this.isReblogged() ? this.entry.status.account : null
  }

  get uri() {
    return this.entry.status.uri
  }

  isDecrypted() {
    return this.entry.decryptedText ? true : false
  }

  get content() {
    return this.isDecrypted() ? this.entry.decryptedText.content : this.mainStatus.rawContent
  }

  get spoilerText() {
    return this.isDecrypted() ? this.entry.decryptedText.spoilerText : this.mainStatus.spoiler_text
  }

  get hasSpoilerText() {
    return this.mainStatus.spoiler_text ? true : false
  }

  /**
   * contentを表示してよいか?
   * @return {bool}
   */
  canShowContent() {
    if(this.hasSpoilerText && !this.isContentOpen)
      return false
    return true
  }
}
