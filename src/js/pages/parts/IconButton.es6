/* @flow */
import React from 'react'
import {Motion, spring} from 'react-motion'

import {IconFont} from 'src/pages/parts'


type Props = {
  active: boolean,
  className: string,
  iconName: string,
  onClick: (SyntheticEvent) => void,
}

export default class IconButton extends React.PureComponent {
  props: Props

  render() {
    const {active, className, iconName, onClick} = this.props

    return (
      <Motion
        defaultStyle={{rotate: active ? -360 : 0}}
        style={{
          rotate: spring(active ? -360 : 0, {stiffness: 120, damping: 7}),
        }}>
        {({rotate}) =>
          <button className={className} onClick={onClick} style={{transform: `rotate(${rotate}deg)`}}>
            <IconFont iconName={iconName} className={active ? 'is-active' : ''} />
          </button>
        }
      </Motion>
    )
  }
}
