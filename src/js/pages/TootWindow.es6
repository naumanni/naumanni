import React from 'react'
import PropTypes from 'prop-types'

import {STORAGE_KEY_LAST_SEND_FROM, STORAGE_KEY_TOOT_VISIBILITY, VISIBLITY_PUBLIC} from 'src/constants'
import {IconFont} from 'src/pages/parts'
import TootForm from './components/TootForm'
import {postStatusManaged} from 'src/infra/TimelineData'


const MODE_TOOT = 'toot'
const MODE_DIRECT = 'direct'


/**
 * Status作成画面
 */
export default class TootWindow extends React.Component {
  static propTypes = {
    onClose: PropTypes.func.isRequired,
  }

  static contextTypes = {
    context: PropTypes.any,
  }

  constructor(...args) {
    super(...args)

    this.state = {
      ...this.getStateFromContext(),
      left: this.props.initialX || 60,
      top: this.props.initialY || 60,
    }
    this.isOnDraggingWindow = false
  }

  /**
   * @override
   */
  componentDidMount() {
    // update accounts
    const {context} = this.context

    this.listenerRemovers = [
      context.onChange(::this.onChangeContext),
    ]
  }

  /**
   * @override
   */
  componentWillUnmount() {
    for(const remover of this.listenerRemovers) {
      remover()
    }
  }

  /**
   * @override
   */
  render() {
    const {tokens} = this.state.tokenState
    const {left, top} = this.state

    return (
      <div className="tootWindow" style={{left, top}}
        onMouseDown={::this.onMouseDown}
      >
        <div className="tootWindow-close">
          <button onClick={this.props.onClose}><IconFont iconName="cancel" /></button>
        </div>

        <TootForm
          initialSendFrom={this.loadSendForm()}
          initialVisibility={this.loadTootVisibility()}
          tokens={tokens}
          onSend={::this.onSend}
          onClose={::this.onClose}
        />
      </div>
    )
  }

  onChangeContext() {
    this.setState(this.getStateFromContext())
  }

  getStateFromContext() {
    const {tokenState} = this.context.context.getState()
    return {
      tokenState,
    }
  }

  async onSend(sendFrom, messageContent) {
    // とりまこっから送る
    await Promise.all(
      sendFrom.map(async (token) => await postStatusManaged(token, messageContent))
    )

    this.saveSendFrom(sendFrom)
    this.saveTootVisibility(messageContent.message.visibility)
  }

  async onClose() {
    this.props.onClose()
  }

  /**
   * 枠内でマウスが押されたら、DragでWindowの場所を動かす
   * @param {SyntheticEvent} e
   */
  onMouseDown(e) {
    if(this.isOnDraggingWindow)
      return

    e.stopPropagation()
    e.preventDefault()

    this.isOnDraggingWindow = true
    this.lastCursorPosition = {
      x: e.pageX,
      y: e.pageY,
    }

    // install handlers
    const onMouseMoveHandler = (e) => {
      const currentPosition = {
        x: e.pageX,
        y: e.pageY,
      }

      let {left, top} = this.state
      this.setState({
        left: left + (currentPosition.x - this.lastCursorPosition.x),
        top: top + (currentPosition.y - this.lastCursorPosition.y),
      })

      this.lastCursorPosition = currentPosition
    }

    const onMouseUpHandler = (e) => {
      document.removeEventListener('mousemove', onMouseMoveHandler)
      document.removeEventListener('mouseup', onMouseUpHandler)
      this.isOnDraggingWindow = false
    }
    document.addEventListener('mousemove', onMouseMoveHandler)
    document.addEventListener('mouseup', onMouseUpHandler)
  }

  saveTootVisibility(visibility) {
    localStorage.setItem(STORAGE_KEY_TOOT_VISIBILITY, visibility)
  }

  loadTootVisibility() {
    return localStorage.getItem(STORAGE_KEY_TOOT_VISIBILITY) || VISIBLITY_PUBLIC
  }

  saveSendFrom(sendFrom) {
    const accts = sendFrom.map((t) => t.acct)
    localStorage.setItem(STORAGE_KEY_LAST_SEND_FROM, JSON.stringify(accts))
  }

  loadSendForm() {
    try {
      // TODO: 値のValidation
      return JSON.parse(localStorage.getItem(STORAGE_KEY_LAST_SEND_FROM))
    } catch(e) {
      // pass
    }
  }
}

