/* @flow */
import React from 'react'
import {FormattedMessage as _FM} from 'react-intl'
import classNames from 'classnames'


type Props = {
  children: ?React.Element<any>,
  isCollapsed: boolean,
  onClickClose: () => void,
}


export default class ColumnHeaderMenu extends React.PureComponent {
  props: Props

  render() {
    const {
      children, isCollapsed,
      onClickClose} = this.props

    return (
      <div className={classNames(
        'column-menuContent',
        {'collapsed': isCollapsed}
      )} ref="container">
        {children}
        <div className="menu-item--close" onClick={onClickClose}>
          <_FM id="column.menu.close" />
        </div>
      </div>
    )
  }
}
