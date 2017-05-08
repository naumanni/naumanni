import React from 'react'
import PropTypes from 'prop-types'
import EXIF from 'exif-js'

import IconFont from './IconFont'
import NowLoading from './NowLoading'
import ThumbnailCanvas from './ThumbnailCanvas'

/**
 * アップロード予定のMediaを描画する
 */
export default class MediaFileThumbnail extends React.Component {
  static propTypes = {
    showClose: PropTypes.bool,
    mediaFile: PropTypes.instanceOf(File).isRequired,
  }

  static defaultProps = {
    showClose: false,
  }

  /**
   * @constructor
   */
  constructor(...args) {
    super(...args)

    this.state = {
      isImage: false,
      canvas: null,
    }
  }

  /**
   * @override
   */
  componentWillReceiveProps(nextProps) {
    // media filesが変更されていたら、サムネイルを新しく作る
    if(nextProps.mediaFile != this.props.mediaFile) {
      if(nextProps.mediaFile) {
        this._loadNewMediaFile(nextProps.mediaFile)
      } else {
        this.setState({
          isImage: false,
          canvas: null,
        })
      }
    }
  }

  /**
   * @override
   */
  componentDidMount() {
    if(this.props.mediaFile)
      this._loadNewMediaFile(this.props.mediaFile)
  }

  /**
   * @override
   */
  render() {
    let {mediaFile} = this.props
    let className = 'mediaThumbnail mediaThumbnail--'
    let child

    if(!mediaFile) {
      className += 'nofile'
    } else if(!this.state.isImage) {
      className += 'generic'
      const iconName = mediaFile.type.startsWith('video/') ? 'video' : 'doc'
      child = (
        <div className="mediaThumbnail-genericFile">
          <span className="mediaThumbnail-type"><IconFont iconName={iconName} /></span>
          <span className="mediaThumbnail-name">{mediaFile.name}</span>
        </div>
      )
    } else if(!this.state.canvas) {
      className += 'loading'
      child = <NowLoading />
    } else {
      className += 'image'
      child = this.state.canvas
    }

    return (
      <div className={className}>
        {this.props.showClose && (
          <button className="mediaThumbnail-close" onClick={this.props.onClose}>
            <IconFont iconName="cancel" />
          </button>)}
        {child}
      </div>
    )
  }

  /**
   * 新しいFileがきたら、ロードして、サムネイルを作る
   * @param {File} newMediaFile 新しいメディアのFile
   */
  _loadNewMediaFile(newMediaFile) {
    let isImage = false

    if(newMediaFile.type.startsWith('image/')) {
      isImage = true
    }

    if(isImage) {
      let reader = new FileReader()
      let image = new Image()
      let exif = null

      image.onload = (e) => {
        let canvas = (
          <ThumbnailCanvas width={400} height={300} image={image} orientation={exif.Orientation} />
        )
        this.setState({canvas})
      }
      reader.onload = (e) => {
        exif = EXIF.readFromBinaryFile(e.target.result)

        reader.onload = (e) => image.src = e.target.result
        reader.readAsDataURL(newMediaFile)
      }
      reader.readAsArrayBuffer(newMediaFile)
    }

    this.setState({isImage, canvas: null})
  }
}
