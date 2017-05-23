import React from 'react'
import {shallow} from 'enzyme'
import {spy} from 'sinon'
import renderer from 'react-test-renderer';

import MediaFileThumbnail from '../MediaFileThumbnail'
import IconFont from '../IconFont'
import NowLoading from '../NowLoading'


const takeSnapshot = (component) => {
  const tree = renderer.create(component).toJSON()
  expect(tree).toMatchSnapshot()
}

describe('MediaFileThumbnail', () => {
  var mediaFile
  var component = <MediaFileThumbnail mediaFile={mediaFile} />
  var wrapper = shallow(component)

  describe('no file', () => {
    it('has mediaThumbnail mediaThumbnail--nofile classes', () => {
      expect(wrapper.find('.mediaThumbnail--nofile').length).toBe(1)
    })

    it('snapshot', () => takeSnapshot(component))
  })

  describe('image file', () => {
    beforeAll(() => {
      mediaFile = new File([new ArrayBuffer(0)], 'image.jpg', {type: 'image/jpg'})
      component = <MediaFileThumbnail mediaFile={mediaFile} />
      wrapper = shallow(component)
    })

    describe('no state of canvas', () => {
      it('has mediaThumbnail mediaThumbnail--generic classes', () => {
        expect(wrapper.find('.mediaThumbnail--generic').length).toBe(1)
      })

      it('snapshot', () => takeSnapshot(component))
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

      it('snapshot', () => takeSnapshot(component))

      describe('has state of canvas', () => {
        it('has mediaThumbnail mediaThumbnail--image classes', () => {
          wrapper.setState({
            canvas: (
              <canvas></canvas>
            ),
          })
          expect(wrapper.find('.mediaThumbnail--image').length).toBe(1)
        })

        it('snapshot', () => takeSnapshot(component))
      })
    })
  })

  describe('video file', () => {
    beforeAll(() => {
      mediaFile = new File([new ArrayBuffer(0)], 'sample.video', {type: 'video/quicktime'})
      component = <MediaFileThumbnail mediaFile={mediaFile} />
      wrapper = shallow(component)
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

    it('snapshot', () => takeSnapshot(component))
  })

  describe('doc file', () => {
    beforeAll(() => {
      mediaFile = new File([''], 'sample.txt')
      component = <MediaFileThumbnail mediaFile={mediaFile} />
      wrapper = shallow(component)
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

    it('snapshot', () => takeSnapshot(component))
  })

  describe('has not showClose props', () => {
    it('has not mediaThumbnail-close element', () => {
      expect(wrapper.find('.mediaThumbnail-close').length).toBe(0)
    })

    it('snapshot', () => takeSnapshot(component))
  })

  describe('has showClose props', () => {
    var onCloseSpy

    beforeAll(() => {
      onCloseSpy = spy()
      component = (
        <MediaFileThumbnail
          mediaFile={mediaFile}
          showClose={true}
          onClose={onCloseSpy} />
      )
      wrapper = shallow(component)
    })

    it('has mediaThumbnail-close element', () => {
      expect(wrapper.find('.mediaThumbnail-close').length).toBe(1)
    })

    it('can be called onClose handler', () => {
      const closeButton = wrapper.find('.mediaThumbnail-close')
      closeButton.simulate('click')
      expect(onCloseSpy.calledOnce).toBeTruthy()
    })

    it('snapshot', () => takeSnapshot(component))
  })
})
