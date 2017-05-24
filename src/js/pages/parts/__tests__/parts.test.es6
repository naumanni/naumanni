import React from 'react';
import renderer from 'react-test-renderer';

import {Account} from 'src/models'
import {DropdownMenuButton, IconFont, NowLoading, UserIconWithHost} from '../'


describe('DropdownMenuButton', () => {
  it('can render button', () => {
    const tree = renderer.create(
      <DropdownMenuButton onRenderMenu={() => <div>menu!!</div>}>
        <div>child!!</div>
      </DropdownMenuButton>
    ).toJSON()
    expect(tree).toMatchSnapshot()
  })

  it('can show and hide menu', () => {
    const component = renderer.create(
      <DropdownMenuButton onRenderMenu={() => <div><a href="http://goo.gl">NiceLink</a></div>}>
        <div>child!!</div>
      </DropdownMenuButton>
    )
    let tree = component.toJSON()
    expect(tree).toMatchSnapshot('DropdownMenuButton can show and hide menu : only button is visible')

    // menu was showed
    expect(tree.children[0].props.className).toBe('dropdownMenuButton-button')
    tree.children[0].props.onClick({preventDefault: jest.fn(), stopPropagation: jest.fn()})
    tree = component.toJSON();
    expect(tree).toMatchSnapshot('DropdownMenuButton can show and hide menu : button and menu are visible')

    // menu was hidden
    tree.props.onMouseLeave()
    tree = component.toJSON();
    expect(tree).toMatchSnapshot('DropdownMenuButton can show and hide menu : only button is visible')

    // menu was showed
    tree.children[0].props.onClick({preventDefault: jest.fn(), stopPropagation: jest.fn()})
    tree = component.toJSON();
    expect(tree).toMatchSnapshot('DropdownMenuButton can show and hide menu : button and menu are visible')

    // menu was closed after link click
    expect(tree.children[1].props.className).toBe('dropdownMenuButton-menu')
    tree.children[1].props.onClick({preventDefault: jest.fn(), stopPropagation: jest.fn()})
    tree = component.toJSON();
    expect(tree).toMatchSnapshot('DropdownMenuButton can show and hide menu : only button is visible')
  })
})


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
