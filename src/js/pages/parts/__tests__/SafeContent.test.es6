import React from 'react'
import {shallow} from 'enzyme'
import renderer from 'react-test-renderer'
import {spy} from 'sinon'

import {
  TOKEN_TEXT, TOKEN_BREAK, TOKEN_URL, TOKEN_MENTION, TOKEN_HASHTAG,
} from 'src/constants'
import {SafeContent} from '../SafeParts'


const takeSnapshot = (component) => {
  const tree = renderer.create(component).toJSON()
  expect(tree).toMatchSnapshot()
}

describe('SafeContent', () => {
  let parsedContent
  let component

  describe('TOKEN_TEXT', () => {
    beforeAll(() => {
      parsedContent = [
        {type: TOKEN_TEXT, text: 'hello'},
      ]
      component = <SafeContent parsedContent={parsedContent} />
    })
    it('match snapshot', () => {
      takeSnapshot(component)
    })
  })

  describe('TOKEN_BREAK', () => {
    beforeAll(() => {
      parsedContent = [
        {type: TOKEN_BREAK},
      ]
      component = <SafeContent parsedContent={parsedContent} />
    })
    it('match snapshot', () => {
      takeSnapshot(component)
    })
  })

  describe('TOKEN_URL', () => {
    describe('normal url', () => {
      beforeAll(() => {
        parsedContent = [
          {type: TOKEN_URL, url: 'http://example.com'},
        ]
        component = <SafeContent parsedContent={parsedContent} />
      })
      it('match snapshot', () => {
        takeSnapshot(component)
      })
    })

    describe('username:password specified url', () => {
      beforeAll(() => {
        parsedContent = [
          {type: TOKEN_URL, url: 'http://john:pass@example.com'},
        ]
        component = <SafeContent parsedContent={parsedContent} />
      })
      it('match snapshot', () => {
        takeSnapshot(component)
      })
    })

    describe('query and anchor specified url', () => {
      beforeAll(() => {
        parsedContent = [
          {type: TOKEN_URL, url: 'http://example.com?q=p#anchor'}
        ]
        component = <SafeContent parsedContent={parsedContent} />
      })
      it('match snapshot', () => {
        takeSnapshot(component)
      })
    })

    describe('long path url', () => {
      beforeAll(() => {
        parsedContent = [
          {type: TOKEN_URL, url: 'http://example.com/abcdefghijklmnopqrstuvwxyz'},
        ]
        component = <SafeContent parsedContent={parsedContent} />
      })
      it('match snapshot', () => {
        takeSnapshot(component)
      })
    })
  })
  
  describe('TOKEN_MENTION', () => {
    let onAvatarClickedSpy

    beforeAll(() => {
      onAvatarClickedSpy = spy()
      parsedContent = [
        {type: TOKEN_MENTION, acct: 'glpt@friends.nico'},
      ]
      component = <SafeContent parsedContent={parsedContent} onAvatarClicked={onAvatarClickedSpy} />
    })
    it('interact with onAvatarClicked handler', () => {
      const wrapper = shallow(component)
      const link = wrapper.find('a')
      link.simulate('click')
      expect(onAvatarClickedSpy.calledOnce).toBeTruthy()

      const acct = parsedContent[0].acct
      expect(onAvatarClickedSpy.calledWith(acct)).toBeTruthy()
    })
    it('match snapshot', () => {
      takeSnapshot(component)
    })
  })

  describe('TOKEN_HASHTAG', () => {
    beforeAll(() => {
      parsedContent = [
        {type: TOKEN_HASHTAG, tag: 'naumanni'},
      ]
      component = <SafeContent parsedContent={parsedContent} />
    })
    it('match snapshot', () => {
      takeSnapshot(component)
    })
  })
})
