/* eslint-disable */
import ChangeEventEmitter from '../EventEmitter'


describe('ChangeEventEmitter', () => {
  var e

  beforeEach(() => {
    e = new ChangeEventEmitter()
  })

  it('can publish event', () => {
    const fn = jest.fn()

    e.onChange(fn)
    expect(fn).not.toHaveBeenCalled()
    e.emitChange()
    expect(fn).toHaveBeenCalled()
  })

  describe('onChange', () => {
    it('returns EventEmitter.prototype.removeListener', () => {
      const fn = jest.fn()
      const remover = e.onChange(fn)

      remover()

      e.emitChange()
      expect(fn).not.toHaveBeenCalled()
    })
  })

  describe('emitChange', () => {
    it('emits with a list of self as arguments', () => {
      const fn = jest.fn()

      e.onChange(fn)
      e.emitChange()
      expect(fn).toHaveBeenCalledWith([e])
    })
  })
})
