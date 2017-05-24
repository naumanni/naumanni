import React from 'react'
import PropTypes from 'prop-types'


/**
 * アイコンフォント
 */
export default class IconFont extends React.PureComponent {
  static propTypes = {
    iconName: PropTypes.string.isRequired,
    className: PropTypes.string,
  }

  /**
   * @override
   */
  render() {
    let className = `icon icon-${this.props.iconName}`
    if(this.props.className)
      className += ' ' + this.props.className

    return <span className={className} />
  }
}
