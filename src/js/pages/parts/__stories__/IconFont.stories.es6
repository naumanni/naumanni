import React from 'react'
import {storiesOf} from '@kadira/storybook'

import IconFont from '../IconFont'


const renderIcon = (iconName) => (
  <div style={{'font-size': '20px'}}>
    <IconFont iconName={iconName}/>
  </div>
)

storiesOf('IconFont', module)
  .addDecorator((story) => (
    <div className="storybookContainer" style={{width: '20px'}}>
      {story()}
    </div>
  ))

  .add('search', () => (renderIcon('search')))
  .add('key', () => (renderIcon('key')))
  .add('camera', () => (renderIcon('camera')))
  .add('nsfw', () => (renderIcon('nsfw')))
  .add('reblog', () => (renderIcon('reblog')))
  .add('toot', () => (renderIcon('toot')))
  .add('globe', () => (renderIcon('globe')))
  .add('lock', () => (renderIcon('lock')))
  .add('users', () => (renderIcon('users')))
  .add('lock-open', () => (renderIcon('lock-open')))
  .add('cog', () => (renderIcon('cog')))
  .add('plus', () => (renderIcon('plus')))
  .add('home', () => (renderIcon('home')))
  .add('star-filled', () => (renderIcon('star-filled')))
  .add('dot-3', () => (renderIcon('dot-3')))
  .add('reply', () => (renderIcon('reply')))
  .add('reply-all', () => (renderIcon('reply-all')))
  .add('right-open-mini', () => (renderIcon('right-open-mini')))
  .add('picture-1', () => (renderIcon('picture-1')))
  .add('eye', () => (renderIcon('eye')))
  .add('eye-off', () => (renderIcon('eye-off')))
  .add('cancel', () => (renderIcon('cancel')))
  .add('video', () => (renderIcon('video')))
  .add('attention', () => (renderIcon('attention')))
  .add('doc', () => (renderIcon('doc')))
  .add('mail', () => (renderIcon('mail')))
  .add('talk', () => (renderIcon('talk')))
  .add('right-open', () => (renderIcon('right-open')))
  .add('left-open', () => (renderIcon('left-open')))
  .add('bell', () => (renderIcon('bell')))
  .add('meh', () => (renderIcon('meh')))
  .add('user-secret', () => (renderIcon('user-secret')))
  .add('user-plus', () => (renderIcon('user-plus')))
  .add('user-times', () => (renderIcon('user-times')))
  .add('hourglass-o', () => (renderIcon('hourglass-o')))
