import React from 'react'
import PropTypes from 'prop-types'


/**
 * メニューがにょっと出てくる
 */
export default class DropdownMenuButton extends React.Component {
  static propTypes = {
    modifier: PropTypes.string,
    // children
    onRenderMenu: PropTypes.func.isRequired,
    onClick: PropTypes.func,
  }

  state = {
    menuVisible: false,
  }

  /**
   * @override
   */
  render() {
    const {modifier} = this.props
    let className = 'dropdownMenuButton'

    if(modifier) {
      className += ` dropdownMenuButton--${modifier}`
    }

    return (
      <div className={className} onMouseLeave={::this.onMouseLeave} style={this.props.style || {}}>
        <div className="dropdownMenuButton-button" onClick={::this.onClickButton}>
          {this.props.children}
        </div>
        {this.state.menuVisible && (
          <div className="dropdownMenuButton-menu" onClick={::this.onClickMenu}>
            {this.props.onRenderMenu()}
          </div>
        )}
      </div>
    )
  }

  onClickButton(e) {
    e.preventDefault()
    this.props.onClick
      ? this.props.onClick(e)
      : this.setState({menuVisible: !this.state.menuVisible})
  }

  onClickMenu() {
    this.setState({menuVisible: false})
  }

  onMouseLeave() {
    this.setState({menuVisible: false})
  }
}
