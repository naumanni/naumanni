import React from 'react'

import {
  TOKEN_TEXT, TOKEN_BREAK, TOKEN_URL, TOKEN_MENTION, TOKEN_HASHTAG,
} from 'src/constants'


const SPLIT_URL_REX = /https?:\/\/([^\/]+)/
const MAX_PATH_LENGTH = 15


export function SafeLink({children, href, ...props}) {
  if(!(href.startsWith('http://') || href.startsWith('https://')))
    href = 'javascript:void(0)'

  return (
    <a href={href} {...props}>{children}</a>
  )
}


export function SafeNote({parsedNote}) {
  return React.createElement(
    'p',
    {},
    ...parsedNote.map((token) => {
      const {type} = token

      if(type === TOKEN_TEXT) {
        return <span>{token.text}</span>
      } else if(type === TOKEN_BREAK) {
        return <br />
      } else if(type === TOKEN_URL) {
        return <a href={token.url} rel="nofollow noopener" target="_blank">{token.url}</a>
      } else if(type === TOKEN_MENTION) {
        return <span>@{token.acct}</span>
      } else if(type === TOKEN_HASHTAG) {
        return <span>#{token.tag}</span>
      } else {
        console.error(token)
      }
    })
  )
}


export function SafeContent({parsedContent, ...props}) {
  return React.createElement(
    'p',
    {},
    ...parsedContent.map((token) => {
      const {type} = token

      if(type === TOKEN_TEXT) {
        return <span>{token.text}</span>
      } else if(type === TOKEN_BREAK) {
        return <br />
      } else if(type === TOKEN_URL) {
        const url = new URL(token.url)

        let host = url.host
        let path = `${url.pathname}${url.search}${url.hash}`

        if(url.username || url.password)
          host = `${url.username}:${url.password}@${host}`
        if(path.length > MAX_PATH_LENGTH)
          path = `${path.substring(0, MAX_PATH_LENGTH)}…`

        return (
          <a href={url.href} rel="nofollow noopener" target="_blank">{host + path}</a>
        )
      } else if(type === TOKEN_MENTION) {
        const {acct} = token
        return <a href={_urlFromAcct(acct)} onClick={(e) => props.onAvatarClicked(acct, e)}>@{acct}</a>
      } else if(type === TOKEN_HASHTAG) {
        return <a href={token.url} rel="nofollow noopener" target="_blank">#{token.tag}</a>
      } else {
        console.error(token)
      }
    })
  )
}


function _urlFromAcct(acct) {
  const [username, host] = acct.split('@')
  return `https://${host}/@${username}`
}
