/* @flow */
import React from 'react'
import classNames from 'classnames'

import {IconFont} from 'src/pages/parts'


type Props = {
  canShowMenuContent: boolean,
  isPrivate: boolean,
  menuContent: React.Element<any>,
  title: React.Element<any>,
  onClickHeader: (e: SyntheticEvent) => void,
  onClickMenu: (e: SyntheticEvent) => void,
}

export default class ColumnHeader extends React.PureComponent {
  props: Props

  render() {
    const {
      canShowMenuContent, isPrivate, menuContent, title,
      onClickHeader, onClickMenu} = this.props

    return (
      <div>
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
        {canShowMenuContent && menuContent}
      </div>
    )
  }
}
