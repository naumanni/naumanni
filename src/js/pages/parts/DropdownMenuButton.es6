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
    enteredMenu: false,
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
      enteredMenu: false,
      menuVisible: false,
    })
  }

  onClickButton(e) {
    e.preventDefault()
    this.setState({menuVisible: !this.state.menuVisible})
  }

  onClickMenu() {
    this.reset()
  }

  onEnteredMenu() {
    this.setState({enteredMenu: true})
  }

  onMouseLeave() {
    this.state.enteredMenu && this.reset()
  }
}
