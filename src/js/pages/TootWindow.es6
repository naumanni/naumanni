import React from 'react'
import PropTypes from 'prop-types'

import {VISIBLITY_DIRECT, VISIBLITY_PRIVATE, VISIBLITY_UNLISTED, VISIBLITY_PUBLIC} from 'src/constants'
import {IconFont} from 'src/pages/parts'
import TootPanel from './components/TootPanel'
import {postStatusManaged} from 'src/infra/TimelineData'


const MODE_TOOT = 'toot'
const MODE_DIRECT = 'direct'


/**
 * Status作成画面
 */
export default class TootWindow extends React.Component {
  static contextTypes = {
    context: PropTypes.any,
  }

  constructor(...args) {
    super(...args)

    this.state = {
      ...this.getStateFromContext(),
    }
  }

  /**
   * @override
   */
  componentDidMount() {
    // update accounts
    const {context} = this.context

    this.listenerRemovers = [
      context.onChange(::this.onChangeConext),
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

    return (
      <div className="tootWindow">
        <div className="tootWindow-close">
          <button onClick={this.props.onClose}><IconFont iconName="cancel" /></button>
        </div>

        <TootPanel
          tokens={tokens}
          onSend={::this.onSend}
        />
      </div>
    )
  }

  onChangeConext() {
    this.setState(this.getStateFromContext())
  }

  getStateFromContext() {
    const {tokenState} = this.context.context.getState()
    return {
      tokenState,
    }
  }

  async onSend({sendFrom, message}) {
    // とりまこっから送る
    const responses = await Promise.all(
      sendFrom.map(async (token) => await postStatusManaged(token, message))
    )
    console.log(responses)

    // close tootwindow
    this.props.onClose()
  }
}

