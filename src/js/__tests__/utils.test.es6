import {parseQuery} from '../utils'

describe('parseQuery()', () => {
  it('can parse query string', () => {
    const result = parseQuery('?hogehoge=mogemoge&fuga=1&hoga')
    expect(result).toHaveProperty('hogehoge', 'mogemoge')
    expect(result).toHaveProperty('fuga', '1')
    expect(result).toHaveProperty('hoga', null)
  })
})
