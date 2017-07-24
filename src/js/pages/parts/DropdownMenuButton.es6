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
  }

  state = {
    isEnteredMenu: false,
    isMenuVisible: false,
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
        {this.state.isMenuVisible && (
          <div
            className="dropdownMenuButton-menu"
            onClick={::this.onClickMenu}
            onMouseEnter={::this.onEnteredMenu}
          >
            {this.props.onRenderMenu()}
          </div>
        )}
      </div>
    )
  }

  reset() {
    this.setState({
      isEnteredMenu: false,
      isMenuVisible: false,
    })
  }

  onClickButton(e) {
    e.preventDefault()
    this.setState({isMenuVisible: !this.state.isMenuVisible})
  }

  onClickMenu() {
    this.reset()
  }

  onEnteredMenu() {
    this.setState({isEnteredMenu: true})
  }

  onMouseLeave() {
    this.state.isEnteredMenu && this.reset()
  }
}
