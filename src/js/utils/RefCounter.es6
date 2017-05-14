export default class RefCounter {
  constructor(options={}) {
    this._counter = 0
    this._options = options
    if(WeakSet)
      this.decrementers = new WeakSet()
  }

  get counter() {
    return this._counter
  }

  increment() {
    this._counter += 1
    if(this._counter === 1 && this._options.onLocked)
      this._options.onLocked()

    const decrementer = () => {
      if(this.decrementers && !this.decrementers.has(decrementer)) {
        return false
      }
      this.decrementers && this.decrementers.delete(decrementer)
      this._counter -= 1
      if(this._counter === 0 && this._options.onUnlocked)
        this._options.onUnlocked()

      return true
    }
    this.decrementers && this.decrementers.add(decrementer)
    return decrementer
  }
}
