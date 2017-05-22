import React from 'react'
import {storiesOf, action} from '@kadira/storybook'

import MediaFileThumbnail from '../MediaFileThumbnail'


class MediaFileThumbnailContainer extends React.Component {
  state = {
    mediaFile: null,
  }

  render() {
    const {mediaFile} = this.state

    return (
      <div>
        <input type="file" onChange={::this.onChangeMediaFile} />
        {mediaFile &&
          <MediaFileThumbnail
            mediaFile={mediaFile}
            showClose={true}
            onClose={::this.onRemoveMediaFile}
          />
        }
      </div>
    )
  }

  onChangeMediaFile(e) {
    if(e.target.files) {
      this.setState({
        mediaFile: e.target.files[0],
      })
    }
  }

  onRemoveMediaFile() {
    action('close')()
  }
}

storiesOf('MediaFileThumbnail', module)
  .addDecorator((story) => (
    <div className="storybookContainer" style={{width: '360px', height: '500px'}}>
      {story()}
    </div>
  ))

  .add('default', () => (
    <MediaFileThumbnailContainer />
  ))
