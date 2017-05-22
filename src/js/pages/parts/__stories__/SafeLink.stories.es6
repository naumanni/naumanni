import React from 'react'
import {storiesOf} from '@kadira/storybook'

import {SafeLink} from '../SafeParts'


storiesOf('SafeLink', module)
  .addDecorator((story) => (
    <div className="storybookContainer" style={{width: '240px'}}>
      {story()}
    </div>
  ))

  .add('http link', () => (
    <SafeLink href="http://example.com" target="_blank">
      {'http://example.com'}
    </SafeLink>
  ))

  .add('https link', () => (
    <SafeLink href="https://friends.nico/@glpt2" target="_blank">
      {'glpt2'}
    </SafeLink>
  ))

  .add('javascript link', () => (
    <SafeLink href="javascript:alert(document.cookie)">
      {'javascript:alert(document.cookie)'}
    </SafeLink>
  ))

  .add('other link', () => (
    <SafeLink href="file:///path/to/some/target">
      {'file:///path/to/some/target'}
    </SafeLink>
  ))
