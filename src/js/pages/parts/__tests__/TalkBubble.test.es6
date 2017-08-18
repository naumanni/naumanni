import React from 'react'
import {mountWithIntl} from 'enzyme-react-intl'
import serializer from 'enzyme-to-json/serializer'
import {List} from 'immutable'

import {Attachment} from 'src/models'
import {TOKEN_HASHTAG} from 'src/constants'
import TalkBubble from '../TalkBubble'


expect.addSnapshotSerializer(serializer)

describe('TalkBubble', () => {
  let defaultProps = {
    createdAt: new Date(2017, 7, 28),
    isEncrypted: false,
    mediaFiles: List([
      new Attachment({
        url: 'https://d2zoeobnny43zx.cloudfront.net/media_attachments/files/000/904/383/small/d8ffd22736103a82.jpg',
        preview_url: 'https://d2zoeobnny43zx.cloudfront.net/media_attachments/files/000/904/383/small/d8ffd22736103a82.jpg',
      })
    ]),
    parsedContent: List([
      {
        type: TOKEN_HASHTAG,
        tag: 'naumanni',
        url: 'https://friends.nico/tags/naumanni',
      }
    ]),
    onClickHashTag: jest.fn(),
    onClickMedia: jest.fn(),
  }

  describe('snapshot', () => {
    it('isEncrypted == false', () => {
      const wrapper = mountWithIntl(<TalkBubble {...defaultProps} />)
      expect(wrapper).toMatchSnapshot()
    })

    it('isEncrypted == true', () => {
      const props = {
        ...defaultProps,
        isEncrypted: true,
      }
      const wrapper = mountWithIntl(<TalkBubble {...props} />)
      expect(wrapper).toMatchSnapshot()
    })
  })

  it('propagate hash tag link click event', () => {
    const onClickHashTag = jest.fn()
    const props = {
      ...defaultProps,
      onClickHashTag,
    }
    const wrapper = mountWithIntl(<TalkBubble {...props} />)

    const hashtag = wrapper.find('p > a')
    hashtag.simulate('click')

    expect(onClickHashTag).toHaveBeenCalled()
  })

  it('propagate media click event', () => {
    const onClickMedia = jest.fn()
    const props = {
      ...defaultProps,
      onClickMedia,
    }
    const wrapper = mountWithIntl(<TalkBubble {...props} />)

    const media = wrapper.find('a.status-media')
    media.simulate('click')

    expect(onClickMedia).toHaveBeenCalled()
  })
})
