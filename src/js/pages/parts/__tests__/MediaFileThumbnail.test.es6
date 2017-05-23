import React from 'react'
import {shallow} from 'enzyme'
import {spy} from 'sinon'

import MediaFileThumbnail from '../MediaFileThumbnail'
import IconFont from '../IconFont'
import NowLoading from '../NowLoading'

describe('MediaFileThumbnail', () => {
  var mediaFile
  var wrapper = shallow(<MediaFileThumbnail mediaFile={mediaFile} />)

  describe('no file', () => {
    it('has mediaThumbnail mediaThumbnail--nofile classes', () => {
      expect(wrapper.find('.mediaThumbnail--nofile').length).toBe(1)
    })
  })

  describe('image file', () => {
    beforeAll(() => {
      mediaFile = new File([new ArrayBuffer(0)], 'image.jpg', {type: 'image/jpg'})
      wrapper = shallow(<MediaFileThumbnail mediaFile={mediaFile} />)
    })

    describe('no state of canvas', () => {
      it('has mediaThumbnail mediaThumbnail--generic classes', () => {
        expect(wrapper.find('.mediaThumbnail--generic').length).toBe(1)
      })
    })

    describe('has state of isImage', () => {
      beforeAll(() => {
        wrapper.setState({
          isImage: true,
        })
      })

      it('renders NowLoading component', () => {
        expect(wrapper.contains(<NowLoading />)).toBeTruthy()
      })

      describe('has state of canvas', () => {
        it('has mediaThumbnail mediaThumbnail--image classes', () => {
          wrapper.setState({
            canvas: (
              <canvas></canvas>
            ),
          })
          expect(wrapper.find('.mediaThumbnail--image').length).toBe(1)
        })
      })
    })
  })

  describe('video file', () => {
    beforeAll(() => {
      mediaFile = new File([new ArrayBuffer(0)], 'sample.video', {type: 'video/quicktime'})
      wrapper = shallow(<MediaFileThumbnail mediaFile={mediaFile} />)
    })

    it('has mediaThumbnail mediaThumbnail--generic classes', () => {
      expect(wrapper.find('.mediaThumbnail--generic').length).toBe(1)
    })

    it('contains mediaThumbnail-genericFile div node', () => {
      const nodes = (
        <div className="mediaThumbnail-genericFile">
          <span className="mediaThumbnail-type"><IconFont iconName={'video'} /></span>
          <span className="mediaThumbnail-name">{'sample.video'}</span>
        </div>
      )
      expect(wrapper.contains(nodes)).toBeTruthy()
    })
  })

  describe('doc file', () => {
    beforeAll(() => {
      mediaFile = new File([''], 'sample.txt')
      wrapper = shallow(<MediaFileThumbnail mediaFile={mediaFile} />)
    })

    it('has mediaThumbnail mediaThumbnail--generic classes', () => {
      expect(wrapper.find('.mediaThumbnail--generic').length).toBe(1)
    })

    it('contains mediaThumbnail-genericFile div node', () => {
      const nodes = (
        <div className="mediaThumbnail-genericFile">
          <span className="mediaThumbnail-type"><IconFont iconName={'doc'} /></span>
          <span className="mediaThumbnail-name">{'sample.txt'}</span>
        </div>
      )
      expect(wrapper.contains(nodes)).toBeTruthy()
    })
  })

  describe('has not showClose props', () => {
    it('has not mediaThumbnail-close element', () => {
      expect(wrapper.find('.mediaThumbnail-close').length).toBe(0)
    })
  })

  describe('has showClose props', () => {
    var onCloseSpy

    beforeAll(() => {
      onCloseSpy = spy()
      wrapper = shallow(
        <MediaFileThumbnail
          mediaFile={mediaFile}
          showClose={true}
          onClose={onCloseSpy} />
        )
    })

    it('has mediaThumbnail-close element', () => {
      expect(wrapper.find('.mediaThumbnail-close').length).toBe(1)
    })

    it('can be called onClose handler', () => {
      const closeButton = wrapper.find('.mediaThumbnail-close')
      closeButton.simulate('click')
      expect(onCloseSpy.calledOnce).toBeTruthy()
    })
  })
})
