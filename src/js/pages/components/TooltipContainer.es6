import React from 'react'
import {is, Map} from 'immutable'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import ImmutablePropTypes from 'react-immutable-proptypes'

import {UITooltipGroup} from 'src/models'


/**
 * Tooltipのコンテナ
 */
export class TooltipContainer extends React.Component {
  static propTypes = {
    tooltips: ImmutablePropTypes.iterableOf(PropTypes.instanceOf(UITooltipGroup)),
  }
  static defaultTypes = {
    tooltips: [],
  }

  constructor(...args) {
    super(...args)

    this.state = {
      positions: new Map(),
    }
    this.listenerRemovers = []
  }

  /**
   * @override
   */
  componentDidMount() {
    const onResizeHandler = ::this.onWindowResize
    window.addEventListener('resize', onResizeHandler, false)
    this.listenerRemovers = [
      () => window.removeEventListener('resize', onResizeHandler),
    ]

    this.updatePositions(this.props.tooltips)
  }

  /**
   * @override
   */
  componentWillReceiveProps(nextProps) {
    if(!is(this.props.tooltips, nextProps.tooltips)) {
      this.updatePositions(nextProps.tooltips)
    }
  }

  /**
   * @override
   */
  componentWillUnmount() {
    this.listenerRemovers.forEach((f) => f())
  }

  /**
   * @override
   */
  render() {
    const {tooltips} = this.props

    return (
      <div className="tooltipContainer" ref="container">
        {tooltips.map((tooltipGroup, idx) => this.renderTooltipGroup(tooltipGroup, idx))}
      </div>
    )
  }

  renderTooltipGroup(tooltipGroup, gidx) {
    const {container, positions} = this.state

    return tooltipGroup.tooltips.map((props, idx) => {
      const clientRect = positions.get(props)
      return <Tooltip {...props} key={`${gidx}-${idx}`} container={container} clientRect={clientRect} />
    })
  }

  onWindowResize() {
    this.updatePositions(this.props.tooltips)
  }

  updatePositions(tooltips) {
    if(!this.refs.container) {
      this.setState({positions: new Map(), container: null})
      return
    }

    const container = ReactDOM.findDOMNode(this.refs.container).getBoundingClientRect()
    const newPositions = this.state.positions.withMutations((newPositions) => {
      for(const group of tooltips) {
        for(const props of group.tooltips) {
          const node = ReactDOM.findDOMNode(props.target)
          const clientRect = node.getBoundingClientRect()

          newPositions.set(props, clientRect)
        }
      }
    })
    if(!is(this.state.positions, newPositions)) {
      this.setState({positions: newPositions, container})
    }
  }
}


/**
 * Tooltipのコンテナ
 */
export default class Tooltip extends React.Component {
  static propTypes = {
    children: PropTypes.any,
    target: PropTypes.any.isRequired,
    position: PropTypes.any,
  }

  render() {
    let {children, clientRect, container, position} = this.props
    const offsetX = this.props.offsetX || 0

    if(!clientRect || !container)
      return null

    const style = {}
    if(position === 'rightTop') {
      style.right = container.width - clientRect.right
      style.top = clientRect.bottom
    } else { // left-top
      position = 'leftTop'
      style.left = clientRect.left + offsetX
      style.top = clientRect.bottom
    }

    return (
      <div className={`tooltip tooltip--${position}`} style={style}>
        <div className="tooltip-content">{children}</div>
      </div>
    )
  }
}
