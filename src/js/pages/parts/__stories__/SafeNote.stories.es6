import React from 'react'
import {storiesOf} from '@kadira/storybook'

import {SafeNote} from '../SafeParts'
import {accountA} from './fixtures'


storiesOf('SafeNote', module)
  .addDecorator((story) => (
    <div className="storybookContainer" style={{width: '360px'}}>
      {story()}
    </div>
  ))

  .add('default', () => (
    <SafeNote parsedNote={accountA.parsedNote} />
  ))
