/* @flow */
import {Store} from 'almin'
import React from 'react'
import TransitionGroup from 'react-transition-group/TransitionGroup'
import {findDOMNode} from 'react-dom'
import classNames from 'classnames'
import {intlShape, FormattedMessage as _FM} from 'react-intl'

import {UIColumn} from 'src/models'
import {ColumnHeaderMenu, IconFont, NowLoading} from 'src/pages/parts'
import {AppPropType, ContextPropType} from 'src/propTypes'
import CloseColumnUseCase from 'src/usecases/CloseColumnUseCase'


type Props = {
  column: UIColumn,
  onClickHeader: (string) => void,
}

type State = {
  loading: boolean,
  menuVisible: boolean,
}


/**
 * カラムのベースクラス
 */
export default class Column extends React.Component {
  props: Props
  state: State
  listenerRemovers: Array<() => void> = []
  renderBody: () => React.Element<any>
  renderTitle: () => React.Element<any>

  static contextTypes = {
    app: AppPropType,
    context: ContextPropType,
    intl: intlShape,
  }

  isPrivate() {
    return false
  }

  constructor(...args: Array<any>) {
    super(...args)

    this.state = {
      ...this.getStateFromContext(),
      menuVisible: this.props.menuVisible || false,
    }
  }

  /**
   * @override
   */
  componentDidMount() {
    // update accounts
    const {context} = this.context

    this.listenerRemovers = [
      context.onChange(this.onChangeContext.bind(this)),
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
    const {loading, menuVisible} = this.state

    return (
      <div className="column">
        {this.renderHeader()}
        <TransitionGroup>
          {menuVisible && this.renderMenuContent()}
        </TransitionGroup>

        {loading
          ? <div className="column-body is-loading"><NowLoading /></div>
          : this.renderBody()
        }
      </div>
    )
  }

  renderHeader() {
    let title = this.renderTitle()

    if(typeof title === 'string')
      title = <h1 className="column-headerTitle">{title}</h1>

    return (
      <header
        className={classNames(
          'column-header',
          {'column-header-private': this.isPrivate()}
        )}
        onClick={this.onClickHeader.bind(this)}
      >
        {title}
        <div className="column-headerMenu">
          <button className="column-headerMenuButton" onClick={this.onClickMenuButton.bind(this)}>
            <IconFont iconName="cog" />
          </button>
        </div>
      </header>
    )
  }

  renderMenuContent() {
    return (
      <ColumnHeaderMenu>
        <div className="menu-item--close" onClick={this.onClickCloseColumn.bind(this)}>
          <_FM id="column.menu.close" />
        </div>
      </ColumnHeaderMenu>
    )
  }

  columnBodyClassName() {
    let columnBodyClassName = ['column-body']

    if(this.state.loading)
      columnBodyClassName.push('is-loading')

    return columnBodyClassName.join(' ')
  }

  scrollNode() {
    return null
  }

  onChangeContext(changingStores: [Store]) {
    this.setState(this.getStateFromContext())
  }

  getStateFromContext() {
    const {context} = this.context
    return context.getState()
  }

  onClickMenuButton(e: SyntheticEvent) {
    e.stopPropagation()
    this.setState({menuVisible: !this.state.menuVisible})
  }

  onClickCloseColumn() {
    const {context} = this.context
    context.useCase(new CloseColumnUseCase()).execute(this.props.column)
  }

  onClickHeader() {
    const node = findDOMNode(this)

    if(node instanceof HTMLElement) {
      const columnBounds = node.getBoundingClientRect()

      if(columnBounds.right > window.innerWidth || columnBounds.left < 0) {
        // if the column is out of the window, adjusts horizontal scroll
        this.props.onClickHeader(this.props.column.key)
      } else {
        // if the column is in the window, reset its scroll offset
        let scrollNode = this.scrollNode()
        if(!scrollNode) {
          return
        }
        scrollNode.scrollTop = 0
      }
    }
  }
}
