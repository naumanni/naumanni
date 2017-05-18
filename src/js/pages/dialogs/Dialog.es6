import React from 'react'
import PropTypes from 'prop-types'

import {UIDialog} from 'src/models'
import CloseDialogUseCase from 'src/usecases/CloseDialogUseCase'
import {IconFont} from 'src/pages/parts'


/**
 * カラムのベースクラス
 */
export default class Dialog extends React.Component {
  static contextTypes = {
    app: PropTypes.any,
    context: PropTypes.any,
  }

  static propTypes = {
    dialog: PropTypes.instanceOf(UIDialog).isRequired,
    visible: PropTypes.bool,
  }
  static defaultProps = {
    visible: true,
  }

  constructor(...args) {
    super(...args)

    this.state = {}
    this.listenerRemovers = []
  }

  /**
   * @override
   */
  componentDidMount() {
  }

  /**
   * @override
   */
  componentWillUnmount() {
    this.listenerRemovers.forEach((remover) => remover())
  }


  /**
   * @override
   */
  render() {
    return (
      <div className={this.dialogClassName}>
        <header className="dialog-header">
          {this.renderHeader()}
        </header>
        <div className="dialog-body">
          {this.renderBody()}
        </div>
        <footer className="dialog-footer">
          {this.renderFooter()}
        </footer>
      </div>
    )
  }

  renderCloseButton() {
    return (
      <button className="dialog-button dialog-button--close" onClick={::this.onClickClose}>
        <IconFont iconName="cancel" />
      </button>
    )
  }

  /**
   * @private
   * @return {string}
   */
  get dialogClassName() {
    const dialogClassName = ['dialog']

    if(this.props.visible)
      dialogClassName.push('is-visible')

    return dialogClassName.join(' ')
  }

  renderHeader() {
    return null
  }

  renderBody() {
    return null
  }

  renderFooter() {
    return null
  }

  close() {
    const {context} = this.context
    context.useCase(new CloseDialogUseCase()).execute(this.props.dialog)
  }

  get app() {
    return this.context.app
  }

  // event handlers
  onClickBackground(e) {
    e.preventDefault()
    this.close()
  }

  onClickClose(e) {
    e.preventDefault()
    this.close()
  }
}


/**
 * closeするときにhistory.back()するdialog
 * もっと良い名前を... 誰か...
 */
export class HistoryRelatedDialog extends Dialog {
  close() {
    this.app.history.back()
  }
}
