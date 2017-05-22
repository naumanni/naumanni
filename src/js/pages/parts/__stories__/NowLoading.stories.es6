import React from 'react'
import {storiesOf} from '@kadira/storybook'

import NowLoading from '../NowLoading'


storiesOf('NowLoading', module)
  .addDecorator((story) => (
    <div className="storybookContainer" style={{width: '44px'}}>
      {story()}
    </div>
  ))

  .add('default', () => (
    <NowLoading />
  ))
