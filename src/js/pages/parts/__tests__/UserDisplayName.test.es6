import React from 'react'
import {shallow} from 'enzyme'
import {spy} from 'sinon'
import renderer from 'react-test-renderer'


import {UserDisplayName} from '../UserParts'
import {mockAccount} from './fixtures'


const takeSnapshot = (component) => {
  const tree = renderer.create(component).toJSON()
  expect(tree).toMatchSnapshot()
}

describe('UserDisplayName', () => {
  let component
  let wrapper

  describe('default', () => {
    beforeAll(() => {
      component = <UserDisplayName account={mockAccount} />
      wrapper = shallow(component)
    })
    it('has user-displayName class', () => {
      expect(wrapper.find('.user-displayName').length).toBe(1)
    })
    it('contains UserLink', () => {
      expect(wrapper.text()).toBe('<UserLink />')
    })
    it('match snapshot', () => {
      takeSnapshot(component)
    })
  })

  describe('onClick', () => {
    let onClickSpy = spy()

    beforeAll(() => {
      component = <UserDisplayName account={mockAccount} onClick={onClickSpy} />
      wrapper = shallow(component)
    })
    it('can be handled', () => {
      const a = wrapper.find('UserLink')
      a.simulate('click')
      expect(onClickSpy.calledOnce).toBeTruthy()
    })
  })
})
