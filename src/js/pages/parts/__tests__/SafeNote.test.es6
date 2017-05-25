import React from 'react'
import {shallow} from 'enzyme'
import renderer from 'react-test-renderer'

import {
  TOKEN_TEXT, TOKEN_BREAK, TOKEN_URL, TOKEN_MENTION, TOKEN_HASHTAG,
} from 'src/constants'
import {SafeNote} from '../SafeParts'


const takeSnapshot = (component) => {
  const tree = renderer.create(component).toJSON()
  expect(tree).toMatchSnapshot()
}

describe('SafeNote', () => {
  let component
  let parsedNote
  let wrapper

  describe('TOKEN_TEXT', () => {
    beforeAll(() => {
      parsedNote = [
        {type: TOKEN_TEXT, text: 'spam'},
      ]
      component = <SafeNote parsedNote={parsedNote} />
      wrapper = shallow(component)
    })
    it('will be converted to <span> element', () => {
      expect(wrapper.html()).toBe('<p><span>spam</span></p>')
      takeSnapshot(component)
    })
  })

  describe('TOKEN_BREAK', () => {
    beforeAll(() => {
      parsedNote = [
        {type: TOKEN_BREAK},
      ]
      component = <SafeNote parsedNote={parsedNote} />
      wrapper = shallow(component)
    })
    it('will be converted to <br /> element', () => {
      expect(wrapper.html()).toBe('<p><br/></p>')
      takeSnapshot(component)
    })
  })

  describe('TOKEN_URL', () => {
    beforeAll(() => {
      parsedNote = [
        {type: TOKEN_URL, url: 'http://example.com'},
      ]
      component = <SafeNote parsedNote={parsedNote} />
      wrapper = shallow(component)
    })
    it('will be converted to <a> element', () => {
      const url = parsedNote[0].url
      expect(wrapper.html()).toBe(
        `<p><a href="${url}" rel="nofollow noopener" target="_blank">${url}</a></p>`
      )
      takeSnapshot(component)
    })
  })

  describe('TOKEN_MENTION', () => {
    beforeAll(() => {
      parsedNote = [
        {type: TOKEN_MENTION, acct: 'john'},
      ]
      component = <SafeNote parsedNote={parsedNote} />
      wrapper = shallow(component)
    })
    it('will be converted to @<span> element', () => {
      const acct = parsedNote[0].acct
      expect(wrapper.html()).toBe(`<p><span>@${acct}</span></p>`)
      takeSnapshot(component)
    })
  })

  describe('TOKEN_HASHTAG', () => {
    beforeAll(() => {
      parsedNote = [
        {type: TOKEN_HASHTAG, tag: 'naumanni'},
      ]
      component = <SafeNote parsedNote={parsedNote} />
      wrapper = shallow(component)
    })
    it('will be converted to #<span> element', () => {
      const tag = parsedNote[0].tag
      expect(wrapper.html()).toBe(`<p><span>#${tag}</span></p>`)
      takeSnapshot(component)
    })
  })

  describe('unknown token', () => {
    beforeAll(() => {
      parsedNote = [
        {type: 'unknown'},
      ]
      component = <SafeNote parsedNote={parsedNote} />
      wrapper = shallow(component)
    })
    it('will be converted to empty <p> element', () => {
      expect(wrapper.html()).toBe('<p></p>')
      takeSnapshot(component)
    })
  })
})
