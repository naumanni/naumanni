import React from 'react'
import {storiesOf, action} from '@kadira/storybook'

import {UserAcct} from '../UserParts'
import {accountA} from './fixtures'


storiesOf('UserAcct', module)
  .addDecorator((story) => (
    <div className="storybookContainer" style={{width: '240px'}}>
      {story()}
    </div>
  ))

  .add('default', () => (
    <UserAcct account={accountA} onClick={(e) => {
      e.preventDefault()

      action('clicked')()
    }}/>
  ))
