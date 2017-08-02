import React from 'react'
import {shallow} from 'enzyme'
import renderer from 'react-test-renderer'

import ColumnHeader from '../ColumnHeader'


const takeSnapshot = (component) => {
  const tree = renderer.create(component).toJSON()
  expect(tree).toMatchSnapshot()
}

describe('ColumnHeader', () => {
  let defaultProps = {
    canShowMenuContent: false,
    isPrivate: false,
    menuContent: <div>menu</div>,
    title: <div>title</div>,
    onClickHeader: jest.fn(),
    onClickMenu: jest.fn(),
  }

  describe('snapshot', () => {
    it('canShowMenuContent == false, isPrivate == false', () => {
      takeSnapshot(<ColumnHeader {...defaultProps} />)
    })

    it('canShowMenuContent == true, isPrivate == true', () => {
      const props = {
        ...defaultProps,
        canShowMenuContent: true,
        isPrivate: true,
      }
      takeSnapshot(<ColumnHeader {...props} />)
    })
  })

  it('propagate header click event', () => {
    const onClickHeader = jest.fn()
    const props = {
      ...defaultProps,
      onClickHeader,
    }
    const component = <ColumnHeader {...props} />
    const wrapper = shallow(component)
    const header = wrapper.find('.column-header')
    header.simulate('click')
    expect(onClickHeader).toHaveBeenCalled()
  })

  it('propagate menu button click event', () => {
    const onClickMenu = jest.fn()
    const props = {
      ...defaultProps,
      onClickMenu,
    }
    const component = <ColumnHeader {...props} />
    const wrapper = shallow(component)
    const header = wrapper.find('.column-headerMenuButton')
    header.simulate('click')
    expect(onClickMenu).toHaveBeenCalled()
  })
})
