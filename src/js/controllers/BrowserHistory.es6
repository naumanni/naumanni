import pathToRegexp from 'path-to-regexp'


const USE_HASH_HISTORY = true


/**
 * Historyのうまい使い方がわからず混乱気味
 */
export default class BrowserHistory {
  /**
   * @constructor
   * @param {Context} context almin context
   */
  constructor(context) {
    this.context = context
    this.history = USE_HASH_HISTORY
      ? require('history/createHashHistory').default({hashType: 'hashbang'})
      : require('history/createBrowserHistory').default()
    this.history.listen(::this.onChangeLocation)
    this.routes = {}
  }

  // manipulate history
  push(path) {
    this.history.push(path)
  }

  replace(path) {
    this.history.replace(path)
  }

  back() {
    this.history.goBack()
  }

  // routing
  start() {
    // dispatch current location'
    const {pathname, search, hash} = this.history.location
    this.replace(`${pathname}${search}${hash}`)
  }

  route(name, path, callback) {
    const route = {
      path,
      name,
      callback,
    }
    route.re = pathToRegexp(path, route.keys = [], {sensitive: true, strict: true})
    this.routes[name] = route
  }

  makeUrl(name, params) {
    const route = this.routes[name]
    const compiled = pathToRegexp.compile(route.path)
    return compiled(params, {pretty: true})
  }

  // private
  onChangeLocation(location, action) {
    this.onChangeState(location, action)
  }

  onChangeState(location, action) {
    // find route
    for(const route of Object.values(this.routes)) {
      const m = route.re.exec(location.pathname)
      if(!m)
        continue

      const {keys} = route
      const params = {}

      for(let i = 1, len = m.length; i < len; ++i) {
        let key = keys[i - 1]
        let val = decodeURIComponent(m[i].replace(/\+/g, ' '))
        if(val !== undefined || !(hasOwnProperty.call(params, key.name))) {
          params[key.name] = val
        }
      }

      if(route.callback(this.context, location, params, action) === false)
        break

      return
    }

    console.error('invalid location', location)
    setTimeout(() => this.replace('/'), 1000)
  }
}
