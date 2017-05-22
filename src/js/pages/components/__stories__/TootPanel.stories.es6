import React from 'react'
import {storiesOf, action, linkTo} from '@kadira/storybook'

import TootForm from '../TootForm'
import {tokens, setTimeoutAsync} from './fixtures'


storiesOf('TootForm', module)
  .addDecorator((story) => (
    <div className="storybookContainer" style={{width: '360px'}}>
      {story()}
    </div>
  ))

  .add('Can show', () => {
    return (
      <TootForm tokens={tokens} onSend={(...args) => {
        action('send')(...args)
        return setTimeoutAsync(500).then(() => {
          console.log('aaa')
          return Promise.reject(new Error('Error dayo.'))
        })
      }} />
    )
  })
