/* @flow */
import React from 'react'
import {List} from 'immutable'
import {NotificationRef, StatusRef} from 'src/infra/TimelineData'

import {AUTO_PAGING_MARGIN, SUBJECT_MIXED} from 'src/constants'
import {AppPropType, ContextPropType} from 'src/propTypes'
import {OAuthToken} from 'src/models'
import TimelineActions from 'src/controllers/TimelineActions'
import {RefCounter} from 'src/utils'
import TimelineNotification from 'src/pages/components/TimelineNotification'
import TimelineStatusContainer from 'src/pages/components/TimelineStatusContainer'
import {NowLoading} from 'src/pages/parts'


type Props = {
  filterRegex?: string,
  isTailLoading: boolean,
  subject: string,
  timeline: List<NotificationRef | StatusRef>,
  tokens: List<OAuthToken>,
  onLoadMoreStatuses: () => void,
  onLockedPaging: () => void,
  onScrollNodeLoaded: (HTMLElement) => void,
  onUnlockedPaging: () => void,
}


export default class PagingColumnContent extends React.PureComponent {
  static contextTypes = {
    app: AppPropType,
    context: ContextPropType,
  }
  props: Props

  actionDelegate: TimelineActions
  scrollLockCounter: RefCounter
  unlockScrollLock: ?Function

  /**
   * @constructor
   */
  constructor(...args: any[]) {
    super(...args)
    this.actionDelegate = new TimelineActions(this.context)
    this.unlockScrollLock = null
    this.scrollLockCounter = new RefCounter({
      onLocked: () => this.props.onLockedPaging(),
      onUnlocked: () => this.props.onUnlockedPaging(),
    })
  }

  /**
   * @override
   */
  render() {
    const {isTailLoading, onScrollNodeLoaded, timeline} = this.props

    return (
      <ul className="timeline" onScroll={this.onTimelineScrolled.bind(this)} ref={onScrollNodeLoaded}>
        {timeline.map((ref) => this.renderTimelineRow(ref))}
        {isTailLoading && <li className="timeline-loading"><NowLoading /></li>}
      </ul>
    )
  }


  // private


  // render

  renderTimelineRow(ref: NotificationRef | StatusRef) {
    const {subject, tokens} = this.props
    let component: React.Element<TimelineStatusContainer | TimelineNotification>

    if(ref instanceof NotificationRef) {
      component = <TimelineNotification
        subject={subject !== SUBJECT_MIXED ? subject : null}
        notificationRef={ref}
        tokens={tokens}
        onLockStatus={() => this.scrollLockCounter.increment()}
        {...this.actionDelegate.props}
      />
    } else {
      const {filterRegex} = this.props

      if(filterRegex != null && filterRegex.trim().length > 0) {
        const regex = new RegExp(filterRegex.trim(), 'i')

        if(regex.test(ref.resolve().plainContent)) {
          return null
        }
      }

      component = <TimelineStatusContainer
        subject={subject !== SUBJECT_MIXED ? subject : null}
        tokens={tokens}
        onLockStatus={() => this.scrollLockCounter.increment()}
        {...ref.expand()}
        {...this.actionDelegate.props}
      />
    }

    return <li key={ref.uri}>{component}</li>
  }

  // cb

  onTimelineScrolled(e: SyntheticEvent) {
    const node = e.target

    if(node instanceof HTMLElement) {
      const {clientHeight, scrollHeight, scrollTop} = node
      const loadMoreThreshold = scrollHeight - AUTO_PAGING_MARGIN

      // Scroll位置がちょっとでもTopから動いたらLockしちゃう
      if(!this.unlockScrollLock && scrollTop > 0) {
        // Scrollが上部以外になったのでScrollをLockする
        require('assert')(!this.unlockScrollLock)
        this.unlockScrollLock = this.scrollLockCounter.increment()
      } else if(this.unlockScrollLock && scrollTop <= 0) {
        // Scrollが上部になったのでScrollをUnlockする
        this.unlockScrollLock()
        this.unlockScrollLock = undefined
      }

      if(loadMoreThreshold <= clientHeight)
        return

      // Scroll位置がBottomまであとちょっとになれば、次を読み込む
      if(scrollTop + clientHeight > loadMoreThreshold && !this.props.isTailLoading) {
        this.props.onLoadMoreStatuses()
      }
    }
  }
}
