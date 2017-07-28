/* @flow */
import React from 'react'
import classNames from 'classnames'

import {IconFont} from 'src/pages/parts'


type Props = {
  isPrivate: boolean,
  title: React.Element<any>,
  onClickHeader: (e: SyntheticEvent) => void,
  onClickMenu: (e: SyntheticEvent) => void,
}

export default class ColumnHeader extends React.PureComponent {
  props: Props

  render() {
    const {
      isPrivate, title,
      onClickHeader, onClickMenu} = this.props

    return (
      <header
        className={classNames(
          'column-header',
          {'column-header-private': isPrivate}
        )}
        onClick={onClickHeader}
      >
        {title}
        <div className="column-headerMenu">
          <button className="column-headerMenuButton" onClick={onClickMenu}>
            <IconFont iconName="cog" />
          </button>
        </div>
      </header>
    )
  }
}
