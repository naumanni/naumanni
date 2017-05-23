import React from 'react'
import {storiesOf} from '@kadira/storybook'

import {CushionString} from '../UserParts'


const render = (length) => (
  <div>
    {'spam'}
    <CushionString length={length} />
    {'ham'}
  </div>
)

storiesOf('CushionString', module)
  .addDecorator((story) => (
    <div className="storybookContainer" style={{width: '200px'}}>
      {story()}
    </div>
  ))

  .add('2 length', () => (
    render(2)
  ))

  .add('10 length', () => (
    render(10)
  ))
