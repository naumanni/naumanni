import moment from 'moment'

import Status from '../Status'


describe('Status', () => {
  it('does not allow call `id`', () => {
    const obj = new Status({
      id_by_host: {
        aaa: 111,
      },
      media_attachments: [],
      content: 'aaa',
      created_at: '2017-05-01T14:02:55.000Z',
    })

    expect.assertions(1)
    expect(() => obj.id).toThrow()
  })

  it('can use getters', () => {
    const acct = 'alice@dummy'
    const acct2 = 'bob@mummy'
    const obj = new Status({
      id_by_host: {
        aaa: 111,
        bbb: 222,
      },
      in_reply_to_id_by_host: {
        aaa: 1919,
        bbb: 4545,
      },
      media_attachments: [{
        id: 666,
      }],
      content: '<p>aaa <a href="http://www.google.com/">http://www.google.com/</a></p>',
      created_at: '2017-05-08T14:02:55.000Z',
      spoiler_text: 'spoiler_text',
      visibility: 'direct',
      reblogged_by_acct: {
        [acct]: true,
      },
      favourited_by_acct: {
        [acct2]: true,
      },
      mentions: [
        {
          acct: acct2,
          id: 1,
          url: 'https://mummy/@bob',
          username: 'bob',
        },
      ],
    })

    expect(obj.getIdByHost('aaa')).toBe(111)
    expect(obj.getIdByHost('bbb')).toBe(222)
    expect(obj.hosts).toEqual(expect.arrayContaining(['aaa', 'bbb']))
    expect(obj.getInReplyToIdByHost('aaa')).toBe(1919)
    expect(obj.getInReplyToIdByHost('bbb')).toBe(4545)
    expect(obj.content).toBe('<p>aaa <a href="http://www.google.com/">http://www.google.com/</a></p>')
    expect(obj.parsedContent.size).toBe(2)
    expect(obj.parsedContent.get(0)).toMatchObject({type: 'text', text: 'aaa '})
    expect(obj.parsedContent.get(1)).toMatchObject({type: 'url'})
    expect.assertions(obj.createdAt.isSame(moment('2017-05-08T14:02:55.000Z')))
    expect.assertions(obj.hasSpoilerText)
    expect(obj.spoilerText).toBe('spoiler_text')
    expect(obj.canReblog()).toBeFalsy()
    expect(obj.isRebloggedAt(acct)).toBeTruthy()
    expect(obj.isFavouritedAt(acct)).toBeFalsy()
    expect(obj.isMentionToURI('https://mummy/@bob')).toBeTruthy()
    expect(obj.isMentionToURI('https://dummy/@alice')).toBeFalsy()
    expect(obj.messageBlockInfo).toBeNull()

    const obj2 = obj.merge({
      content: '@bob@my.host --NEM.7b352097.1/2--dummytext',
      visibility: 'public',
    })
    expect(obj2.canReblog()).toBeTruthy()
    expect(obj2.messageBlockInfo).toMatchObject({checksum: '7b352097', index: 1, total: 2})
  })

  it('can compare date', () => {
    const a = new Status({
      id_by_host: {
        aaa: 111,
      },
      favourited_by_acct: {},
      media_attachments: [],
      content: 'aaa',
      created_at: '2017-05-01T14:02:55.000Z',
    })
    const b = new Status({
      id_by_host: {
        bbb: 222,
      },
      favourited_by_acct: {},
      media_attachments: [],
      content: 'aaa',
      created_at: '2017-05-08T14:02:55.000Z',
    })

    expect(Status.compareForTimeline(a, b)).toBe(1)
    expect(Status.compareForTimeline(b, a)).toBe(-1)
    expect(Status.compareForTimeline(a, a)).toBe(0)
  })

  it('can merge', () => {
    const oldObj = new Status({
      id_by_host: {
        aaa: 111,
      },
      media_attachments: [],
      content: 'aaa',
      spoiler_text: 'abc',
      fetched_at: '2017-05-08T14:02:55.000Z',
    })
    const newObj = new Status({
      id_by_host: {
        bbb: 222,
      },
      media_attachments: [],
      content: 'aaa',
      spoiler_text: 'def',
      fetched_at: null,
    })
    let {isChanged, merged} = oldObj.checkMerge(newObj)

    expect(merged.getIdByHost('aaa')).toBe(111)
    expect(merged.getIdByHost('bbb')).toBe(222)

    // fetched_atは特別扱い。常にnullではない最古の値を使う
    expect(merged.fetched_at).toBe('2017-05-08T14:02:55.000Z')
    merged = newObj.checkMerge(oldObj).merged  // 逆方向
    expect(merged.fetched_at).toBe('2017-05-08T14:02:55.000Z')
    const objC = newObj.set('fetched_at', '2017-05-08T14:02:55.010Z')
    merged = oldObj.checkMerge(objC).merged
    expect(merged.fetched_at).toBe('2017-05-08T14:02:55.000Z')
  })

  it('can merge map attribute', () => {
    const oldObj = new Status({
      id_by_host: {
        aaa: 111,
      },
      reblogged_by_acct: {
        'shn@oppai.tokyo': false,
        'shnx@pawoo.net': false,
        'shn@mstdn.onosendai.jp': true,
      },
    }, {isOriginal: true})
    const newObj = new Status({
      id_by_host: {
        aaa: 111,
      },
      reblogged_by_acct: {
        'shn@mstdn.onosendai.jp': false,
      },
    })
    const {isChanged, merged} = oldObj.checkMerge(newObj)

    expect(isChanged).toBeTruthy()
    expect(merged.isRebloggedAt('shn@mstdn.onosendai.jp')).toBeFalsy()
  })

  it('should not merge same object', () => {
    const oldObj = new Status({
      id_by_host: {
        aaa: 111,
      },
      media_attachments: [],
      content: 'aaa',
    })
    const newObj = new Status({
      id_by_host: {
        aaa: 111,
      },
      media_attachments: [],
      content: 'aaa',
    })
    const {isChanged, merged} = oldObj.checkMerge(newObj)

    expect(isChanged).toBe(false)
    expect(merged.getIdByHost('aaa')).toBe(111)
  })
})
