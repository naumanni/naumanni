/* @flow */
import React from 'react'
import {TweenMax} from 'gsap'
import {FormattedMessage as _FM} from 'react-intl'


type Props = {
  children: ?React.Element<any>,
  onClickClose: () => void,
}


export default class ColumnHeaderMenu extends React.PureComponent {
  props: Props

  /**
   * @override
   */
  componentWillEnter(callback: () => void) {
    TweenMax.fromTo(this.refs.container, 0.3, {y: -100, opacity: 0}, {y: 0, opacity: 1, onComplete: callback})
  }

  /**
   * @override
   */
  componentWillLeave(callback: () => void) {
    TweenMax.fromTo(this.refs.container, 0.3, {y: 0, opacity: 1}, {y: -100, opacity: 0, onComplete: callback})
  }

  /**
   * @override
   */
  render() {
    const {onClickClose} = this.props

    return (
      <div className="column-menuContent" ref="container">
        {this.props.children}
        <div className="menu-item--default" onClick={onClickClose}>
          <_FM id="column.menu.close" />
        </div>
      </div>
    )
  }
}
