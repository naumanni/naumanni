import React from 'react'

const nbsp = String.fromCharCode(0xA0)


export function UserLink({account, className, children, ...props}) {
  return <a className={className} href={account.url} target="_blank" {...props}>{children}</a>
}

export function UserDisplayName({account, ...props}) {
  return <UserLink account={account} className="user-displayName" {...props}>{account.displayName}</UserLink>
}

export function UserAcct({account, ...props}) {
  return <UserLink account={account} className="user-acct" {...props} >@{account.acct}</UserLink>
}

export function CushionString({length}) {
  return <span className="cushionString">{new Array(length).fill(nbsp).join('')}</span>
}
