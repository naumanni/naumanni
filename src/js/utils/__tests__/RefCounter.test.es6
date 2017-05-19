/* eslint-disable */
import RefCounter from '../RefCounter'


describe('RefCounter', () => {
  describe('increment', () =>{
    it('increments its count', () => {
      const refCounter = new RefCounter({})

      expect(refCounter.counter).toBe(0)
      refCounter.increment()
      expect(refCounter.counter).toBe(1)
    })

    it('returns decrementer', () => {
      const refCounter = new RefCounter({})
      const decrementer = refCounter.increment()

      expect(refCounter.counter).toBe(1)
      decrementer()
      expect(refCounter.counter).toBe(0)
    })

    it('calls onLocked function at first increments', () => {
      const onLocked = jest.fn()
      const refCounter = new RefCounter({
        onLocked,
      })

      refCounter.increment()
      refCounter.increment()
      expect(onLocked).toHaveBeenCalledTimes(1)
    })

    it('calls onUnlocked funtion when reset completed', () => {
      const onUnlocked = jest.fn()
      const refCounter = new RefCounter({
        onUnlocked,
      })
      const decrementer = refCounter.increment()

      decrementer()
      expect(onUnlocked).toHaveBeenCalled()
    })
  })
})
