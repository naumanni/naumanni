import React from 'react'
import {shallow} from 'enzyme'
import {spy} from 'sinon'
import renderer from 'react-test-renderer'


import {UserAcct} from '../UserParts'
import {mockAccount} from './fixtures'


const takeSnapshot = (component) => {
  const tree = renderer.create(component).toJSON()
  expect(tree).toMatchSnapshot()
}

describe('UserAcct', () => {
  let component
  let wrapper

  describe('default', () => {
    beforeAll(() => {
      component = <UserAcct account={mockAccount} />
      wrapper = shallow(component)
    })
    it('has user-acct class', () => {
      expect(wrapper.find('.user-acct').length).toBe(1)
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
      component = <UserAcct account={mockAccount} onClick={onClickSpy} />
      wrapper = shallow(component)
    })
    it('can be handled', () => {
      const a = wrapper.find('UserLink')
      a.simulate('click')
      expect(onClickSpy.calledOnce).toBeTruthy()
    })
  })
})
