/* eslint-disable */
import React from 'react'
import {List} from 'immutable'
import {shallow} from 'enzyme'

import {VISIBLITY_PUBLIC, VISIBLITY_DIRECT} from 'src/constants'
import TootForm from '../TootForm'
import {intlContext} from 'src/testUtils'
import {tokens} from './fixtures'


describe('TootForm', () => {
  const context = {
    ...intlContext,
  }

  let defaultProps = {
    tokens: new List(tokens),
    onSend: jest.fn(),
    onClose: jest.fn(),
  }

  let wrapper

  beforeAll(() => {
    wrapper = shallow(
      <TootForm {...defaultProps} />,
      {context}
    )
  })

  describe('Toot visibility', () => {
    describe('no initialVisibility prop', () => {
      it('default visibility is public', () => {
        expect(wrapper.state('visibility')).toBe(VISIBLITY_PUBLIC)
      })
    })

    describe('has initialVisibility prop', () => {
      it('default visibility is specified one', () => {
        wrapper = shallow(
          <TootForm {...defaultProps} initialVisibility={VISIBLITY_DIRECT} />,
          {context}
        )
        expect(wrapper.state('visibility')).toBe(VISIBLITY_DIRECT)
      })
    })
  })

  describe('Toot sensitivity', () => {
    it('sensitive is false as default', () => {
      expect(wrapper.state('sensitive')).toBeFalsy()
    })

    describe('has no media files', () => {
      it('NSFW button is not being rendered', () => {
        expect(wrapper.find('.tootForm-toggleNsfw').length).toBe(0)
      })
    })

    describe('has media files', () => {
      const media1 = new File([new ArrayBuffer(0)], 'image1.jpg', {type: 'image/jpg'})
      const media2 = new File([new ArrayBuffer(0)], 'image2.jpg', {type: 'image/jpg'})

      beforeEach(() => {
        wrapper = shallow(
          <TootForm {...defaultProps} />,
          {context}
        )
        wrapper.setState({
          mediaFiles: [media1, media2],
        })
      })

      it('NSFW button is being rendered', () => {
        expect(wrapper.find('.tootForm-toggleNsfw').length).toBe(1)
      })
      it('sensitive can be toggled', () => {
        const toggleNsfwButton = wrapper.find('.tootForm-toggleNsfw')
        toggleNsfwButton.simulate('click')
        expect(wrapper.state('sensitive')).toBeTruthy()
        toggleNsfwButton.simulate('click')
        expect(wrapper.state('sensitive')).toBeFalsy()
      })
      it('sensitive will be falthy when all media files were removed', () => {
        const toggleNsfwButton = wrapper.find('.tootForm-toggleNsfw')
        toggleNsfwButton.simulate('click')
        wrapper.instance().onRemoveMediaFile(media1)
        expect(wrapper.state('sensitive')).toBeTruthy()
        wrapper.instance().onRemoveMediaFile(media2)
        expect(wrapper.state('sensitive')).toBeFalsy()
      })
    })
  })
})
