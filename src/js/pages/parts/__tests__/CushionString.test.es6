import React from 'react'
import {shallow} from 'enzyme'
import renderer from 'react-test-renderer'

import {CushionString} from '../UserParts'


const takeSnapshot = (component) => {
  const tree = renderer.create(component).toJSON()
  expect(tree).toMatchSnapshot()
}

describe('CushionString', () => {
  let component = <CushionString length={4} />
  let wrapper = shallow(component)

  it('has cushionString class', () => {
    expect(wrapper.find('.cushionString').length).toBe(1)
  })
  it('match snapshot', () => {
    takeSnapshot(
      <div>
        spam
        {component}
        ham
      </div>
    )
  })
})
