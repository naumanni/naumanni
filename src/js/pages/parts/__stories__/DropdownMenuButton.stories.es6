import React from 'react'
import {storiesOf} from '@kadira/storybook'

import DropdownMenuButton from '../DropdownMenuButton'


const DummyMenu = () => (
  <div>menu</div>
)

const DummyContent = () => (
  <div>content</div>
)

storiesOf('DropdownMenuButton', module)
  .addDecorator((story) => (
    <div className="storybookContainer" style={{width: '44px'}}>
      {story()}
    </div>
  ))

  .add('render menu', () => {
    return (
      <DropdownMenuButton onRenderMenu={() => {}}>
        <DummyMenu />
      </DropdownMenuButton>
    )
  })

  .add('toggle content by clicking menu', () => {
    return (
      <DropdownMenuButton onRenderMenu={() => {
        return <DummyContent />
      }}>
        <DummyMenu />
      </DropdownMenuButton>
    )
  })
