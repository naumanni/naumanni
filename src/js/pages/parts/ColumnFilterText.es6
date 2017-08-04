/* @flow */
import React from 'react'


type Props = {
  onChange: (string) => void,
  placeholder: string,
  value: string,
}


export default class ColumnFilterText extends React.PureComponent {
  props: Props

  render() {
    const {placeholder, value} = this.props

    return (
      <div className="menu-item">
        <input
          className="menu-filterRegexInput"
          onChange={this.onChange.bind(this)}
          placeholder={placeholder}
          value={value}
        />
      </div>
    )
  }

  // private

  onChange(e: SyntheticInputEvent) {
    this.props.onChange(e.target.value)
  }
}
