import React from 'react'
import {findDOMNode} from 'react-dom'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import {UIColumn} from 'src/models'
import {DropdownMenuButton, IconFont, NowLoading} from 'src/pages/parts'
import {AppPropType, ContextPropType} from 'src/propTypes'
import CloseColumnUseCase from 'src/usecases/CloseColumnUseCase'


/**
 * カラムのベースクラス
 */
export default class Column extends React.Component {
  static contextTypes = {
    app: AppPropType,
    context: ContextPropType,
  }

  static propTypes = {
    column: PropTypes.instanceOf(UIColumn).isRequired,
  }

  isPrivate() {
    return false
  }

  constructor(...args) {
    super(...args)

    this.state = this.getStateFromContext()
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
    const {loading} = this.state
    let title = this.renderTitle()

    if(typeof title === 'string')
      title = <h1 className="column-headerTitle">{title}</h1>

    const headerClass = classNames(
      'column-header',
      {'column-header-private': this.isPrivate()}
    )

    return (
      <div className="column">
        <header className={headerClass} onClick={::this.onClickHeader}>
          {title}
          <div className="column-headerMenu">
            <DropdownMenuButton onRenderMenu={::this.onRenderColumnMenu}>
              <button className="column-headerMenuButton"><IconFont iconName="cog" /></button>
            </DropdownMenuButton>
          </div>
        </header>

        {loading
          ? <div className="column-body is-loading"><NowLoading /></div>
          : this.renderBody()
        }
      </div>
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

  onChangeConext(changingStores) {
    this.setState(this.getStateFromContext())
  }

  getStateFromContext() {
    const {context} = this.context
    return context.getState()
  }

  onRenderColumnMenu() {
    return (
      <ul className="menu menu--column">
        <li className="menu-item"
          onClick={::this.onClickCloseColumn}
          >
          <span className="menu-itemLabel">Close</span>
        </li>

      </ul>
    )
  }

  onClickCloseColumn() {
    const {context} = this.context
    context.useCase(new CloseColumnUseCase()).execute(this.props.column)
  }

  onClickHeader() {
    const columnBounds = findDOMNode(this).getBoundingClientRect()

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
