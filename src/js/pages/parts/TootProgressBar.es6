import React from 'react'
import PropTypes from 'prop-types'
import {Line} from 'rc-progress'


export default class TootProgressBar extends React.Component {
  static propTypes = {
    progress: PropTypes.number.isRequired,
    statusText: PropTypes.string.isRequired,
  }

  render() {
    const {progress, statusText} = this.props

    return (
      <div className="tootForm-progress">
        <span className="tootForm-progressStatus">{statusText}</span>
        <Line percent={progress} strokeWidth="2" strokeColor="#D3D3D3" />
      </div>
    )
  }
}
