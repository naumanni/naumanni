/* @flow */
import React from 'react'
import classNames from 'classnames'

import {IconFont} from '../parts'
import MediaFileThumbnail from 'src/pages/parts/MediaFileThumbnail'


export default class TalkForm extends React.PureComponent {
  props: {
    mediaFiles: File[],
    mediaFileKeys: WeakMap<File, number>,
    placeholder: string,
    sensitive: boolean,
    text: string,
    onChange: (SyntheticInputEvent) => void,
    onChangeMediaFile: (SyntheticInputEvent) => void,
    onClickToggleNsfw: (SyntheticEvent) => void,
    onKeyDown: (SyntheticKeyboardEvent) => void,
    onRemoveMediaFile: (File) => void,
  }

  /**
   * @override
   */
  render() {
    const {
      text, onChange, onKeyDown, placeholder,
      mediaFiles, onChangeMediaFile,
      sensitive, onClickToggleNsfw,
    } = this.props

    return (
      <div className="talkForm-content">
        <div className="talkForm-status">
          <textarea
            value={text}
            onChange={onChange}
            onKeyDown={onKeyDown}
            placeholder={placeholder} />
        </div>

        {this.renderMediaFiles()}

        <div className="talkForm-contentActions">
          <label className="tootForm-addMedia">
            <IconFont iconName="camera" />
            <input
              type="file"
              multiple="multiple"
              style={{display: 'none'}} ref="fileInput" onChange={onChangeMediaFile} />
          </label>
          {mediaFiles.length > 0 &&
            <button
              className={classNames(
                'tootForm-toggleNsfw',
                {'is-active': sensitive},
              )}
              type="button"
              onClick={onClickToggleNsfw}>
              <IconFont iconName="nsfw" />
            </button>
          }
        </div>
      </div>
    )
  }

  // render
  renderMediaFiles() {
    const {mediaFiles, mediaFileKeys, onRemoveMediaFile} = this.props

    if(!mediaFiles) {
      return null
    }

    return (
      <div className="talkForm-mediaFiles">
        {mediaFiles.map((file) => {
          return <MediaFileThumbnail
            key={mediaFileKeys.get(file)} mediaFile={file} showClose={true}
            onClose={() => onRemoveMediaFile(file)} />
        })}
      </div>
    )
  }
}
