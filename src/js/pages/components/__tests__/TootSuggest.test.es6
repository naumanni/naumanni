import React from 'react'
import {shallow} from 'enzyme'
import renderer from 'react-test-renderer'

import TootSuggest from '../TootSuggest'
import {accountA, accountB} from './fixtures'


const takeSnapshot = (component) => {
  const tree = renderer.create(component).toJSON()
  expect(tree).toMatchSnapshot()
}

describe('TootSuggest', () => {
  const selectedSuggestion = 0
  let defaultProps = {
    width: 100,
    selectedSuggestion,
    suggestions: [],
    onClickSuggest: () => {},
  }
  let component

  describe('Account suggestions', () => {
    const suggestions = [accountA, accountB]
    const onClickSuggest = jest.fn()
    const props = {
      ...defaultProps,
      suggestions,
      onClickSuggest,
    }
    component = <TootSuggest {...props} />
    const wrapper = shallow(component)

    it('render suggestions', () => {
      const items = wrapper.find('.tootForm-autoSuggestions-item')
      expect(items).toHaveLength(suggestions.length)
      expect(items.at(selectedSuggestion).hasClass('selected')).toBeTruthy()
    })
    it('handle click event', () => {
      const items = wrapper.find('.tootForm-autoSuggestions-item')
      items.at(selectedSuggestion).simulate('click')
      expect(onClickSuggest).toHaveBeenCalled()
      expect(onClickSuggest).toHaveBeenCalledWith(suggestions[selectedSuggestion])
    })
    it('match snapshot', () => {
      takeSnapshot(component)
    })
  })

  describe('Hashtag suggestions', () => {
    const suggestions = ['spam', 'ham', 'egg']
    const onClickSuggest = jest.fn()
    const props = {
      ...defaultProps,
      suggestions,
      onClickSuggest,
    }
    component = <TootSuggest {...props} />
    const wrapper = shallow(component)

    it('render suggestions', () => {
      const items = wrapper.find('.tootForm-autoSuggestions-item')
      expect(items).toHaveLength(suggestions.length)
      expect(items.at(selectedSuggestion).hasClass('selected')).toBeTruthy()
    })
    it('handle click event', () => {
      const items = wrapper.find('.tootForm-autoSuggestions-item')
      items.at(selectedSuggestion).simulate('click')
      expect(onClickSuggest).toHaveBeenCalled()
      expect(onClickSuggest).toHaveBeenCalledWith(suggestions[selectedSuggestion])
    })
    it('match snapshot', () => {
      takeSnapshot(component)
    })
  })
})
