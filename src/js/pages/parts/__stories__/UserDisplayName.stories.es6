import React from 'react'
import {storiesOf, action} from '@kadira/storybook'

import {UserDisplayName} from '../UserParts'
import {accountA} from './fixtures'


storiesOf('UserDisplayName', module)
  .addDecorator((story) => (
    <div className="storybookContainer" style={{width: '240px'}}>
      {story()}
    </div>
  ))

  .add('default', () => (
    <UserDisplayName account={accountA} onClick={(e) => {
      e.preventDefault()

      action('clicked')()
    }}/>
  ))
