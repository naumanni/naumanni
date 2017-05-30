/* eslint-disable */
import React from 'react'
import {List} from 'immutable'
import {mount, shallow} from 'enzyme'

import {
  KEY_TAB, KEY_ENTER, KEY_ESC, KEY_ARROW_UP, KEY_ARROW_DOWN,
} from 'src/constants'
import AutoSuggestTextarea from '../AutoSuggestTextarea'
import {accountA, accountB, tokens} from './fixtures'


describe('AutoSuggestTextarea', () => {
  const defaultProps = {
    statusContent: '',
    tokens: new List(tokens),
    onChangeStatus: jest.fn(),
    onKeyDown: jest.fn()
  }
  const createWrapper = (method, props=defaultProps) => {
    return method(<AutoSuggestTextarea {...props} />)
  }
  const simulateKeyDown = (node, keyCode) => {
      const keyDown = {keyCode, metaKey: false, ctrlKey: false, altKey: false}

      node.simulate('keyDown', keyDown)
  }
  let wrapper = createWrapper(shallow)

  describe('Textarea', () => {
    it('should propagate its value', () => {
      const onChangeStatus = jest.fn()
      const props = {
        ...defaultProps,
        onChangeStatus,
      }
      wrapper = createWrapper(mount, props)
      const textarea = wrapper.find('textarea')
      const value = 'hello'

      textarea.simulate('change', {target: {value}})

      expect(onChangeStatus).toHaveBeenCalled()
      expect(onChangeStatus).toHaveBeenCalledWith(value)
    })

    it('should propagate its keyDown', () => {
      const onKeyDown = jest.fn()
      const props = {
        ...defaultProps,
        onKeyDown,
      }
      wrapper = createWrapper(mount, props)
      const textarea = wrapper.find('textarea')

      simulateKeyDown(textarea, KEY_TAB)
      
      expect(onKeyDown).toHaveBeenCalled()
    })
  })

  describe('autosuggestions', () => {
    describe('no suggestions', () => {
      it('suggestions container is invisible as default', () => {
        expect(wrapper.state('suggestions').length).toBe(0)
        expect(wrapper.find('.tootForm-autoSuggestions').length).toBe(0)
      })
    })

    describe('has suggestions', () => {
      beforeEach(() => {
        wrapper.setState({
          lastSuggestQuery: 'abracadabra',
          suggestions: [accountA, accountB],
        })
      })

      it('suggestions are visible', () => {
        expect(wrapper.find('.tootForm-autoSuggestions').length).toBe(1)
        expect(wrapper.find('.tootForm-autoSuggestions-item').length).toBe(2)
      })

      describe('control suggestions by pressing keys', () => {
        it('default selectedSuggestion index should be 0', () => {
          expect(wrapper.state('selectedSuggestion')).toBe(0)
        })
        it('can be switched selectedSuggestion when ↓ or ↑ pressed', () => {
          const textarea = wrapper.find('textarea')

          simulateKeyDown(textarea, KEY_ARROW_DOWN)
          expect(wrapper.state('selectedSuggestion')).toBe(1)

          simulateKeyDown(textarea, KEY_ARROW_UP)
          expect(wrapper.state('selectedSuggestion')).toBe(0)
        })

        describe('determine suggestions', () => {
          let onChangeStatus

          beforeEach(() => {
            onChangeStatus = jest.fn()
            const props = {
              ...defaultProps,
              onChangeStatus,
            }
            wrapper = createWrapper(mount, props)
            wrapper.setState({
              lastSuggestQuery: 'abracadabra',
              suggestions: [accountA, accountB],
            })
          })

          it('selected suggestion will be propagated by pressing TAB key', () => {
            const textarea = wrapper.find('textarea')

            simulateKeyDown(textarea, KEY_ARROW_DOWN)
            simulateKeyDown(textarea, KEY_TAB)
            expect(onChangeStatus).toHaveBeenCalled()
            expect(onChangeStatus).toHaveBeenCalledWith(`${accountB.acct} `)
          })
          it('selected suggestion will be propagated by pressing ENTER key', () => {
            const textarea = wrapper.find('textarea')

            simulateKeyDown(textarea, KEY_ENTER)
            expect(onChangeStatus).toHaveBeenCalled()
          })
        })
      })
    })
  })
})
