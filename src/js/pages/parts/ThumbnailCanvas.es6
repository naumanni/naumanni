import React from 'react'
import {findDOMNode} from 'react-dom'


/**
 * Imageを受け取ってそのサムネイルを書く
 */
export default class ThumbnailCanvas extends React.Component {
  /**
   * @override
   */
  componentDidMount() {
    this._updateCanvas()
  }

  /**
   * @override
   */
  componentDidUpdate() {
    this._updateCanvas()
  }

  /**
   * @override
   */
  render() {
    return (
      <canvas width={this.props.width} height={this.props.height} ref="canvas" />
    )
  }

  /**
   * canvasの更新
   */
  _updateCanvas() {
    let ctx = findDOMNode(this.refs.canvas).getContext('2d')
    // canvasの大きさ
    let {width, height} = this.props
    // imgの大きさ
    let {naturalWidth, naturalHeight} = this.props.image
    // 回転補正後のimgの大きさ
    let [sourceWidth, sourceHeight] = this._getImageRealSize()
    // 縮小率 aspect-fill
    let ratio = Math.max(width / sourceWidth, height / sourceHeight)
    //
    let imageWidth = naturalWidth * ratio
    let imageHeight = naturalHeight * ratio

    // debugger
    ctx.save()

    ctx.translate((width - sourceWidth * ratio) / 2, (height - sourceHeight * ratio) / 2)
    switch(this.props.orientation) {
    case 2:
      // horizontal flip
      ctx.translate(imageWidth, 0)
      ctx.scale(-1, 1)
      break
    case 3:
      // 180° rotate left
      ctx.translate(imageWidth, imageHeight)
      ctx.rotate(Math.PI)
      break
    case 4:
      // vertical flip
      ctx.translate(0, imageHeight)
      ctx.scale(1, -1)
      break
    case 5:
      // vertical flip + 90 rotate right
      ctx.rotate(0.5 * Math.PI)
      ctx.scale(1, -1)
      break
    case 6:
      // 90° rotate right
      ctx.rotate(0.5 * Math.PI)
      ctx.translate(0, -naturalHeight * ratio)
      break
    case 7:
      // horizontal flip + 90 rotate right
      ctx.rotate(0.5 * Math.PI)
      ctx.translate(imageWidth, -imageHeight)
      ctx.scale(-1, 1)
      break
    case 8:
      // 90° rotate left
      ctx.rotate(-0.5 * Math.PI)
      ctx.translate(-imageWidth, 0)
      break
    }
    ctx.drawImage(this.props.image, 0, 0, imageWidth, imageHeight)
    ctx.restore()
  }

  /**
   * exif.orientationを考慮した後の画像のサイズを返す
   * @return {array} [width, height]
   */
  _getImageRealSize() {
    let {naturalWidth, naturalHeight} = this.props.image

    switch(this.props.orientation) {
    case 5:
    case 6:
    case 7:
    case 8:
      return [naturalHeight, naturalWidth]

    default:
      return [naturalWidth, naturalHeight]
    }
  }
}
