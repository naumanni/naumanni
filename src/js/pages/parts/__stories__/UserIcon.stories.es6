import React from 'react'
import {storiesOf} from '@kadira/storybook'

import {UserIconWithHost} from '../UserIcon'
import {accountA} from './fixtures'


storiesOf('UserIconWithHost', module)
  .addDecorator((story) => (
    <div className="storybookContainer" style={{width: '88px'}}>
      {story()}
    </div>
  ))

  .add('default', () => (
    <UserIconWithHost account={accountA} />
  ))

  .add('mini', () => (
    <UserIconWithHost account={accountA} size="mini" />
  ))

  .add('small', () => (
    <UserIconWithHost account={accountA} size="small" />
  ))

  .add('large', () => (
    <UserIconWithHost account={accountA} size="large" />
  ))
