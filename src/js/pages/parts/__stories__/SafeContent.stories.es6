import React from 'react'
import {storiesOf} from '@kadira/storybook'

import {SafeContent} from '../SafeParts'
import {statusA} from './fixtures'


storiesOf('SafeContent', module)
  .addDecorator((story) => (
    <div className="storybookContainer" style={{width: '360px'}}>
      {story()}
    </div>
  ))

  .add('default', () => (
    <SafeContent parsedContent={statusA.parsedContent} />
  ))
