import {
  WEBSOCKET_EVENT_ERROR, WEBSOCKET_EVENT_OPEN, WEBSOCKET_EVENT_MESSAGE, WEBSOCKET_EVENT_CLOSE,
} from 'src/constants'


class WebsocketConnection {
  constructor(url) {
    this.url = url
    this.socket = null
    this.listeners = []
  }

  on(listener) {
    this.listeners.push(listener)
  }

  off(listener) {
    let idx = this.listeners.indexOf(listener)
    if(idx < 0)
      throw new Error('listener not found')
    this.listeners.splice(idx, 1)
  }

  get countListeners() {
    return this.listeners.length
  }

  conncetIfNeed() {
    const socket = new WebSocket(this.url)

    this.socket = socket
    socket.onopen = ::this.onOpen
    socket.onclose = ::this.onClose
    socket.onerror = ::this.onError
    socket.onmessage = ::this.onMessage
  }

  onError(e) {
    console.log('onError', e)
    this.emit(WEBSOCKET_EVENT_ERROR, null, e)
  }

  onMessage(e) {
    console.log('onMessage', e)

    // / mastodon orientedな処理
    try {
      const frame = JSON.parse(e.data)
      frame.payload = frame.payload && JSON.parse(frame.payload)
      this.emit(WEBSOCKET_EVENT_MESSAGE, frame, e)
    } catch(e) {
      console.error(e)
      throw e
    }
  }

  onOpen(e) {
    console.log('onOpen', e)
    this.emit(WEBSOCKET_EVENT_OPEN, null, e)
  }

  onClose(e) {
    console.log('onClose', e)
    this.emit(WEBSOCKET_EVENT_CLOSE, null, e)
  }

  emit(type, payload, source) {
    for(const l of this.listeners) {
      // TODO: try/catch要るかな?
      l({connection: this, type, payload, source})
    }
  }
}


/**
 * Websocketを管理したりする
 */
class WebsocketManager {
  constructor() {
    this.websockets = {}
  }

  listen(wsUrl, listener) {
    if(!this.websockets[wsUrl]) {
      this.websockets[wsUrl] = new WebsocketConnection(wsUrl)
    }
    const conn = this.websockets[wsUrl]

    conn.on(listener)
    conn.conncetIfNeed()

    return () => {
      this.unlisten(wsUrl, listener)
    }
  }

  unlisten(wsUrl, listener) {
    if(!this.websockets[wsUrl]) {
      throw new Error(`living ws connection ${wsUrl} not found.`)
    }

    const conn = this.websockets[wsUrl]

    conn.off(listener)

    if(conn.countListeners == 0) {
      // remove connection
      delete this.websockets[wsUrl]
      conn.close()
    }
  }
}

export default new WebsocketManager()
