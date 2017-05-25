import React from 'react'
import {shallow} from 'enzyme'
import renderer from 'react-test-renderer'

import {SafeLink} from '../SafeParts'


const takeSnapshot = (component) => {
  const tree = renderer.create(component).toJSON()
  expect(tree).toMatchSnapshot()
}

describe('SafeLink', () => {
  let component

  describe('http link', () => {
    beforeAll(() => {
      component = <SafeLink href="http://example.com" />
    })
    it('allowed as href', () => {
      const wrapper = shallow(component)
      expect(wrapper.prop('href')).toBe('http://example.com')
      takeSnapshot(component)
    })
  })

  describe('https link', () => {
    beforeAll(() => {
      component = <SafeLink href="https://example.com" />
    })
    it('allowed as href', () => {
      const wrapper = shallow(component)
      expect(wrapper.prop('href')).toBe('https://example.com')
      takeSnapshot(component)
    })
  })

  describe('javascript link', () => {
    beforeAll(() => {
      component = <SafeLink href={'javascript:alert(document.cookie)'} />
    })
    it('will be converted to "javascript:void(0)"', () => {
      const wrapper = shallow(component)
      expect(wrapper.prop('href')).toBe('javascript:void(0)')
      takeSnapshot(component)
    })
  })

  describe('children', () => {
    beforeAll(() => {
      component = (
        <SafeLink href="http://example.com">
          {'spam'}
        </SafeLink>
      )
    })
    it('will be passed as its children', () => {
      const wrapper = shallow(component)
      expect(wrapper.text()).toBe('spam')
      takeSnapshot(component)
    })
  })

  describe('props', () => {
    beforeAll(() => {
      component = <SafeLink href="http://example.com" target="_blank" />
    })
    it('will be passed as attributes', () => {
      const wrapper = shallow(component)
      expect(wrapper.prop('target')).toBe('_blank')
      takeSnapshot(component)
    })
  })
})
