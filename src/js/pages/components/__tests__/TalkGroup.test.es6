import React from 'react'
import {shallow} from 'enzyme'
import serializer from 'enzyme-to-json/serializer'

import {TOKEN_MENTION, TOKEN_TEXT} from 'src/constants'
import {TalkBlock} from 'src/controllers/TalkListener'
import {
  talkAccountA, talkAccountB,
  talkStatusA1, talkStatusB1, talkStatusB2, talkStatusA2,
} from './fixtures'
import TalkGroup, {TalkGroupModel} from '../TalkGroup'


expect.addSnapshotSerializer(serializer)


const talkBlock1 = new TalkBlock(talkStatusA1, talkAccountA)
const talkBlock2 = new TalkBlock(talkStatusB1, talkAccountB)
talkBlock2.push(talkStatusB2)
const talkBlock3 = new TalkBlock(talkStatusA2, talkAccountA)


describe('TalkGroupModel', () => {

  describe('own talk', () => {
    const me = talkAccountA
    const model = new TalkGroupModel(me, talkBlock1, undefined, talkBlock2)

      it('`isMyTalk` will be true', () =>  expect(model.isMyTalk).toBeTruthy() )
      it('`showName` will be false', () =>  expect(model.showName).toBeFalsy() )
      it('`showAvatar` will be false', () =>  expect(model.showAvatar).toBeFalsy() )
  })

  describe('member\'s talk', () => {
    const me = talkAccountB
    let model

    it('`isMyTalk` will be false', () => {
      expect(model.isMyTalk).toBeFalsy()
    })

    describe('as new TalkBlock', () => {
      model = new TalkGroupModel(me, talkBlock2, talkBlock1, talkBlock3)
      it('`showName` will be true', () =>  expect(model.showName).toBeTruthy() )
    })

    describe('as last TalkBlock', () => {
      model = new TalkGroupModel(me, talkBlock3, talkBlock2, undefined)
      it('`showAvatar` will be true', () =>  expect(model.showAvatar).toBeTruthy() )
    })
  })
})


describe('TalkGroup', () => {
  const talk = [talkBlock1, talkBlock2, talkBlock3]
  const createShallowWrapper = (me, talkGroup, prevTalkGroup, nextTalkGroup) => {
    const targetsAccts = new Set([talkAccountA, talkAccountB].map(({acct}) => acct))
    if(!talkGroup.contents) {
      talkGroup.contents = talkGroup.statuses.map((status) => {
        // 冒頭のmentionだけ省く
        let isHead = true
        let parsedContent = status.parsedContent
          .filter((token) => {
            if(isHead) {
              if(token.type === TOKEN_MENTION && targetsAccts.has(token.acct))
                return false
              else if(token.type === TOKEN_TEXT && !token.text.trim())
                return false
              else
                isHead = false
            }
            return true
          })

        return {
          key: status.uri,
          parsedContent: parsedContent,
          createdAt: status.createdAt,
        }
      })
    }
    const model = new TalkGroupModel(me, talkGroup, prevTalkGroup, nextTalkGroup)
    const {isMyTalk, showName, showAvatar} = model
    const props = {
      isMyTalk,
      showName,
      showAvatar,
      talkGroup,
      onClickHashTag: jest.fn(),
    }
    return shallow(<TalkGroup {...props} />)
  }

  describe('own talk', () => {
    const me = talkAccountA
    const wrapper = createShallowWrapper(me, talkBlock1, undefined, talkBlock2)
    it('match snapshot', () => expect(wrapper).toMatchSnapshot())
  })

  describe('member\'s talk', () => {
    const me = talkAccountB
    describe('member\'s talk as new TalkBlock', () => {
      const wrapper = createShallowWrapper(me, talkBlock2, talkBlock1, talkBlock3)
      it('match snapshot', () => expect(wrapper).toMatchSnapshot())
    })
    describe('member\'s talk as last TalkBlock', () => {
      const wrapper = createShallowWrapper(me, talkBlock3, talkBlock2, undefined)
      it('match snapshot', () => expect(wrapper).toMatchSnapshot())
    })
  })
})
