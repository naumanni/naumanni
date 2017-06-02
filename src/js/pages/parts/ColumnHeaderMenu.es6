import React from 'react'
import {TweenMax} from 'gsap'


export default class ColumnHeaderMenu extends React.Component {
  componentWillEnter(callback) {
    TweenMax.fromTo(this.refs.container, 0.3, {y: -100, opacity: 0}, {y: 0, opacity: 1, onComplete: callback})
  }

  componentWillLeave(callback) {
    TweenMax.fromTo(this.refs.container, 0.3, {y: 0, opacity: 1}, {y: -100, opacity: 0, onComplete: callback})
  }

  /**
   * @override
   */
  render() {
    return (
      <div className="column-menuContent" ref="container">
        {this.props.children}
      </div>
    )
  }
}
