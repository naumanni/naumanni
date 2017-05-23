import React from 'react'
import {storiesOf} from '@kadira/storybook'
import EXIF from 'exif-js'

import ThumbnailCanvas from '../ThumbnailCanvas'


class Container extends React.Component {
  state = {
    canvas: null,
  }

  render() {
    const {canvas} = this.state

    return (
      <div>
        <input type="file" accept="image/*" onChange={::this.onChangeMediaFile} />
        {canvas !== null &&
          canvas
        }
      </div>
    )
  }

  onChangeMediaFile(e) {
    const mediaFile = e.target.files[0]
    let reader = new FileReader()
    let image = new Image()
    let exif = null

    image.onload = (e) => {
      let canvas = (
        <div>
          <ThumbnailCanvas width={400} height={300} image={image} orientation={exif.Orientation} />
        </div>
      )
      this.setState({canvas})
    }
    reader.onload = (e) => {
      exif = EXIF.readFromBinaryFile(e.target.result)

      reader.onload = (e) => image.src = e.target.result
      reader.readAsDataURL(mediaFile)
    }
    reader.readAsArrayBuffer(mediaFile)
  }
}


storiesOf('ThumbnailCanvas', module)
  .addDecorator((story) => (
    <div className="storybookContainer" style={{width: '440px', height: '340px'}}>
      {story()}
    </div>
  ))

  .add('draw image', () => (
    <Container />
  ))
