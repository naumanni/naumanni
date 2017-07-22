import React from 'react'

import {emojify} from 'src/utils'

const nbsp = String.fromCharCode(0xA0)


export function UserLink({account, className, html, children, ...props}) {
  return html
    ? <a className={className} href={account.url} target="_blank"
      dangerouslySetInnerHTML={{__html: html}} {...props} />
    : <a className={className} href={account.url} target="_blank" {...props}>{children}</a>
}
// propsの中でrendering対象のkey
UserLink.propDeepKeys = {
  'account': new Set(['url']),
}


export function UserDisplayName({account, ...props}) {
  const html = emojify(account.displayName)

  return <UserLink account={account} className="user-displayName" html={html} {...props} />
}
// propsの中でrendering対象のkey
UserDisplayName.propDeepKeys = {
  'account': new Set(['display_name', ...UserLink.propDeepKeys.account]),
}


export function UserAcct({account, ...props}) {
  return <UserLink account={account} className="user-acct" {...props} >@{account.acct}</UserLink>
}
// propsの中でrendering対象のkey
UserAcct.propDeepKeys = {
  'account': new Set(['acct', ...UserLink.propDeepKeys.account]),
}


export function CushionString({length}) {
  return <span className="cushionString">{nbsp}</span>
}
