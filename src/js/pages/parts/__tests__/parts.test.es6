import React from 'react'
import renderer from 'react-test-renderer'

import {Account} from 'src/models'
import {IconFont, NowLoading, UserIconWithHost} from '../'


test('IconFont', () => {
  const tree = renderer.create(
    <IconFont iconName="iconA" />
  ).toJSON()
  expect(tree).toMatchSnapshot()

  const treeB = renderer.create(
    <IconFont iconName="iconB" />
  ).toJSON()
  expect(treeB).toMatchSnapshot()
})


test('NowLoading', () => {
  const tree = renderer.create(
    <NowLoading />
  ).toJSON()
  expect(tree).toMatchSnapshot()
})


describe('UserIconWithHost', () => {
  it('can show user icon', () => {
    const mockAccount = new Account({
      acct: 'shn@oppai.tokyo',
      avatar: 'https://ot-mastodon.s3.amazonaws.com/accounts/avatars/000/000/001/original/2408e330e310f168.png?1492583237',
      display_name: 'Shin Adachi',
    })
    const tree = renderer.create(
      <UserIconWithHost account={mockAccount} />
    ).toJSON()
    expect(tree).toMatchSnapshot()
  })

  it('can show default icon if not avatar was present', () => {
    const mockAccount = new Account({
      acct: 'shn@oppai.tokyo',
      avatar: null,
      display_name: 'Shin Adachi',
    })
    const tree = renderer.create(
      <UserIconWithHost account={mockAccount} />
    ).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
