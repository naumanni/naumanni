import React from 'react'
import PropTypes from 'prop-types'


/**
 * アイコンフォント
 */
export default class IconFont extends React.Component {
  static propTypes = {
    iconName: PropTypes.string.isRequired,
  }

  /**
   * @override
   */
  render() {
    return <span className={`icon icon-${this.props.iconName}`} />
  }
}
