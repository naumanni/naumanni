import React from 'react'
import update from 'immutability-helper'
import PropTypes from 'prop-types'

import {VISIBLITY_DIRECT, VISIBLITY_PRIVATE, VISIBLITY_UNLISTED, VISIBLITY_PUBLIC} from 'src/constants'
import {IconFont} from 'src/pages/parts'
import TootPanel from './components/TootPanel'


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

  onClickTab(mode) {
    const update = {mode}

    if(mode === MODE_DIRECT) {
      // DMの場合はFromは1人
      if(this.state.sendFrom.length)
        update.sendFrom = this.state.sendFrom[0]
    }

    this.setState(update)
  }

  onChangeMessageTo(e) {
    this.setState({messageTo: e.target.value})
  }

  onChangeSpoilerText(e) {
    this.setState({spoilerTextContent: e.target.value})
  }

  onChangeStatus(e) {
    this.setState({statusContent: e.target.value})
  }

  onClickVisibility(visibility) {
    this.setState({visibility})
  }

  onClickToggleShowContentsWarning() {
    this.setState({showContentsWarning: !this.state.showContentsWarning}, () => {
      if(this.state.showContentsWarning)
        this.refs.textareaSpoilerText.focus()
    })
  }

  onToggleSendFrom(account) {
    // DMのときはRadio、TootのときはMulti Post
    let {mode, sendFrom} = this.state
    if(mode === MODE_TOOT) {
      const idx = sendFrom.indexOf(account.address)

      if(idx >= 0) {
        sendFrom = update(sendFrom, {$splice: [[idx, 1]]})
      } else {
        sendFrom = update(sendFrom, {$push: [account.address]})
      }
    } else {
      sendFrom = [account.address]
    }

    this.setState({sendFrom})
  }

  async onSend({sendFrom, message}) {
    // とりまこっから送る
    const responses = await Promise.all(
      sendFrom.map(async (token) => {
        // in_reply_to_id を付加する
        // 同Hostにしか付加できない
        if(status.hosts.indexOf(token.host) >= 0) {
          // TODO: tootpanelの方にwarning出す?
          message.in_reply_to_id = status.id
        }
        return await token.requester.postStatus(message)
      })
    )
    console.log(responses)

    // close tootwindow
    this.props.onClose()
  }
}

