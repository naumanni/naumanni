import React from 'react'
import {mount, shallow} from 'enzyme'
import serializer from 'enzyme-to-json/serializer'

import {KEY_ENTER} from 'src/constants'
import TalkForm from '../TalkForm'


expect.addSnapshotSerializer(serializer)


describe('TalkForm', () => {
  const defaultProps = {
    mediaFiles: [],
    mediaFileKeys: new WeakMap(),
    placeholder: 'placeholder',
    sensitive: false,
    text: 'test',
    onChange: jest.fn(),
    onChangeMediaFile: jest.fn(),
    onClickToggleNsfw: jest.fn(),
    onKeyDown: jest.fn(),
    onRemoveMediaFile: jest.fn(),
  }

  describe('snapshot', () => {
    describe('has no mediaFiles', () => {
      const wrapper = shallow(<TalkForm {...defaultProps} />)
      it('', () => expect(wrapper).toMatchSnapshot())
    })

    describe('has mediaFiles', () => {
      const mediaFile = new File([new ArrayBuffer(0)], 'image1.jpg', {
        type: 'image/jpg', lastModified: new Date(2017, 7, 31)})
      const mediaFileKeys = new WeakMap()
      mediaFileKeys.set(mediaFile, 1)

      describe('has no sensitive content', () => {
        const props = {
          ...defaultProps,
          mediaFiles: [mediaFile],
          mediaFileKeys,
        }
        const wrapper = shallow(<TalkForm {...props} />)
        it('', () => expect(wrapper).toMatchSnapshot())
      })
      describe('has sensitive content', () => {
        const props = {
          ...defaultProps,
          mediaFiles: [mediaFile],
          mediaFileKeys,
          sensitive: true,
        }
        const wrapper = shallow(<TalkForm {...props} />)
        it('', () => expect(wrapper).toMatchSnapshot())
      })
    })
  })

  it('propagate input text change event', () => {
    const onChange = jest.fn()
    const onKeyDown = jest.fn()
    const props = {
      ...defaultProps,
      onChange,
      onKeyDown,
    }
    const wrapper = shallow(<TalkForm {...props} />)
    const textarea = wrapper.find('textarea')
    let e = {target: 'spam'}
    textarea.simulate('change', e)
    expect(onChange).toHaveBeenCalledWith(e)
    e = {keyCode: KEY_ENTER, metaKey: false, ctrlKey: true, altKey: false}
    textarea.simulate('keyDown', e)
    expect(onKeyDown).toHaveBeenCalledWith(e)
  })

  it('propagate file input change event', () => {
    const onChangeMediaFile = jest.fn()
    const props = {
      ...defaultProps,
      onChangeMediaFile,
    }
    const wrapper = shallow(<TalkForm {...props} />)
    const mediaFile = new File([new ArrayBuffer(0)], 'image1.jpg', {
      type: 'image/jpg', lastModified: new Date(2017, 7, 31)})
    const e = {
      target: {
        files: [mediaFile]
      }
    }
    wrapper.find('input').simulate('change', e)
    expect(onChangeMediaFile).toHaveBeenCalledWith(e)
  })

  it('propagate click NSFW button event', () => {
    const onClickToggleNsfw = jest.fn()
    const mediaFile = new File([new ArrayBuffer(0)], 'image1.jpg', {
      type: 'image/jpg', lastModified: new Date(2017, 7, 31)})
    const mediaFileKeys = new WeakMap()
    mediaFileKeys.set(mediaFile, 1)
    const props = {
      ...defaultProps,
      mediaFiles: [mediaFile],
      mediaFileKeys,
      onClickToggleNsfw,
    }
    const wrapper = shallow(<TalkForm {...props} />)
    wrapper.find('button.tootForm-toggleNsfw').simulate('click')
    expect(onClickToggleNsfw).toHaveBeenCalled()
  })

  it('propagate click remove file event', () => {
    const onRemoveMediaFile = jest.fn()
    const mediaFile = new File([new ArrayBuffer(0)], 'image1.jpg', {
      type: 'image/jpg', lastModified: new Date(2017, 7, 31)})
    const mediaFileKeys = new WeakMap()
    mediaFileKeys.set(mediaFile, 1)
    const props = {
      ...defaultProps,
      mediaFiles: [mediaFile],
      mediaFileKeys,
      onRemoveMediaFile,
    }
    const wrapper = mount(<TalkForm {...props} />)
    wrapper.find('button.mediaThumbnail-close').simulate('click')
    expect(onRemoveMediaFile).toHaveBeenCalledWith(mediaFile)
  })
})
