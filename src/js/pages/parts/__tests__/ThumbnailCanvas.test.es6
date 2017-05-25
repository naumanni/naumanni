import React from 'react'
import {shallow} from 'enzyme'

import ThumbnailCanvas from '../ThumbnailCanvas'


describe('ThumbnailCanvas', () => {
  it('only contains canvas', () => {
    const wrapper = shallow(<ThumbnailCanvas width={400} height={300} image={new Image()} orientation={2} />)
    expect(wrapper.html()).toBe('<canvas width="400" height="300"></canvas>')
  })
})
