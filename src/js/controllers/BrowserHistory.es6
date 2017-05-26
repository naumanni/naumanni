import pathToRegexp from 'path-to-regexp'


/**
 * Historyのうまい使い方がわからず混乱気味
 */
export default class BrowserHistory {
  /**
   * @constructor
   * @param {Context} context almin context
   * @param {bool} useHash
   */
  constructor(context, useHash=false) {
    this.context = context
    this.useHash = useHash
    this.history = useHash
      ? require('history/createHashHistory').default({basename: '/', hashType: 'hashbang'})
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

  /**
   * 現在、与えられたUrlかどうかを判定する
   * @param {string} url 試したいUrl
   * @return {bool}
   */
  is(url) {
    // TODO: めっちゃ雑
    return this.history.location.pathname === url
  }

  makeUrl(name, params, options={}) {
    const route = this.routes[name]
    const compiled = pathToRegexp.compile(route.path)
    const pathname = compiled(params, {pretty: true})

    if(!options.external)
      return pathname

    let href = this.history.createHref({pathname})
    if(!href.startsWith('/'))
      href = '/' + href
    return `${window.location.origin}${href}`
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

      if(route.callback(this, location, params, action) === false)
        break

      return
    }

    console.error('invalid location', location)
    setTimeout(() => this.replace('/'), 1000)
  }
}
