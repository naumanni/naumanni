import React from 'react'
import {List} from 'immutable'
import {shallow} from 'enzyme'

import {VISIBLITY_PUBLIC, VISIBLITY_DIRECT} from 'src/constants'
import TootForm from '../TootForm'
import {intlContext} from 'src/testUtils'
import {tokens} from './fixtures'


describe('TootForm', () => {
  let defaultProps = {
    tokens: new List(tokens),
    onSend: jest.fn(),
    onClose: jest.fn(),
  }

  describe('Toot visibility', () => {
    describe('no initialVisibility prop', () => {
      it('default visibility is public', () => {
        const wrapper = shallow(
          <TootForm {...defaultProps} />,
          {context: {...intlContext}}
        )
        expect(wrapper.state('visibility')).toBe(VISIBLITY_PUBLIC)
      })
    })

    describe('has initialVisibility prop', () => {
      it('default visibility is specified one', () => {
        const wrapper = shallow(
          <TootForm {...defaultProps} initialVisibility={VISIBLITY_DIRECT} />,
          {context: {...intlContext}}
        )
        expect(wrapper.state('visibility')).toBe(VISIBLITY_DIRECT)
      })
    })
  })
})
