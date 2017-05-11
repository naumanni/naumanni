import React from 'react'

import Dialog from './Dialog'


/**
 * メディア表示ダイアログ
 */
export default class MediaViewerDialog extends Dialog {
  /**
   * @override
   */
  render() {
    const {media} = this.props

    return (
      <div className={`${this.dialogClassName} dialog--mediaViewer--${media.type}`}>
        {this.renderCloseButton()}
        {media.type === 'image'
          ? this.renderImage(media)
          : this.renderVideo(media)
        }
      </div>
    )
  }

  renderImage(media) {
    return (
      <img src={media.url} />
    )
  }

  renderVideo(media) {
    const props = {autoPlay: true}

    if(media.type === 'video') {
      props.controls = true
    } else if(media.type === 'gifv') {
      props.loop = true
    }

    return (
      <video src={media.url} {...props} />
    )
  }

  /**
   * @override
   * @private
   * @return {string}
   */
  get dialogClassName() {
    return super.dialogClassName + ' dialog--mediaViewer'
  }
}
