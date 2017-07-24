import React from 'react'
import {shallow} from 'enzyme'
import serializer from 'enzyme-to-json/serializer'

import DropdownMenuButton from '../DropdownMenuButton'


expect.addSnapshotSerializer(serializer)

const toggleMenu = (wrapper) => {
  wrapper.find('.dropdownMenuButton-button').simulate('click', {
    preventDefault: jest.fn(),
  })
}

describe('DropdownMenuButton', () => {
  const button = <button className="testbutton">button</button>
  const menu = <div className="testmenu">menu</div>
  const component = (
     <DropdownMenuButton onRenderMenu={() => menu}>
       {button}
     </DropdownMenuButton>
  )
  let wrapper

  beforeEach(() => {
    wrapper = shallow(component)
  })

  afterEach(() => {
    expect(wrapper).toMatchSnapshot()
  })

  it('only button children is visible as default', () => {
    expect(wrapper.find('.testbutton').length).toBe(1)
    expect(wrapper.find('.testmenu').length).toBe(0)
  })
  it('menu is visible after button clicked', () => {
    toggleMenu(wrapper)
    expect(wrapper.find('.testmenu').length).toBe(1)
  })

  describe(':after menu shown -', () => {
    beforeEach(() => {
      toggleMenu(wrapper)
    })

    it('menu is still visible when detect mouseleave from component', () => {
      expect(wrapper.find('.testmenu').length).toBe(1)
      wrapper.find('.dropdownMenuButton').simulate('mouseleave')
      expect(wrapper.find('.testmenu').length).toBe(1)
    })
    it('menu is invisible when detect mouseleave from component after detect mouseenter from menu element', () => {
      expect(wrapper.find('.testmenu').length).toBe(1)
      wrapper.find('.dropdownMenuButton-menu').simulate('mouseenter')
      wrapper.find('.dropdownMenuButton').simulate('mouseleave')
      expect(wrapper.find('.testmenu').length).toBe(0)
    })
    it('menu is invisible after menu button clicked again', () => {
      expect(wrapper.find('.testmenu').length).toBe(1)
      toggleMenu(wrapper)
      expect(wrapper.find('.testmenu').length).toBe(0)
    })
  })
})
