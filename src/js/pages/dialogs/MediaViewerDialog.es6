import React from 'react'

import {IconFont} from 'src/pages/parts'
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
        <button className="dialog-closeButton" onClick={::this.onClickClose}><IconFont iconName="cancel" /></button>
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
   * @private
   * @return {string}
   */
  get dialogClassName() {
    return super.dialogClassName + ' dialog--mediaViewer'
  }

  /**
   * @override
   */
  onClickBackground(e) {
    e.preventDefault()
    this.close()
  }

  onClickClose(e) {
    e.preventDefault()
    this.close()
  }
}
