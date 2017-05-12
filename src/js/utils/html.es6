import twitter from 'twitter-text'
import {AllHtmlEntities} from 'html-entities'

import {
  TOKEN_TEXT, TOKEN_BREAK, TOKEN_URL, TOKEN_MENTION, TOKEN_HASHTAG,
} from 'src/constants'


const BR_REX = /<br(\s+\/)?>/ig
const TAG_REX = /<\s*(\/?\w+)(?:\s+(.*?))?>/g
const ATTR_REX = /(\S+)=["']?((?:.(?!["']?\s+(?:\S+)=|[>"']))+.)["']?/g
const HTML_MENTION_REX = /^<a (?:.*?)href="([^"]+)(?:.*?)">@(?:<span>)?([a-zA-Z0-9_]{1,20})(?:<\/span>)?<\/a><\/span>/i
const END_A_TAG_REX = /<\s*\/a\s*>/g


// patch twitter-text
twitter.regexen.validMentionOrList = twitter.regexSupplant(
  '(#{validMentionPrecedingChars})' +       // $1: Preceding character
  '(?:#{atSigns})' +                        //     At mark
  '([a-zA-Z0-9_]{1,20})' +                  // $2: Screen name
  '(?:#{atSigns}([a-z0-9\.\-]+[a-z0-9]+))?' // $3: instance (optional)
, 'g')
twitter.extractMentionsOrListsWithIndices = function(text) {
  if(!text || !text.match(twitter.regexen.atSigns)) {
    return []
  }

  let possibleNames = []
  text.replace(
    twitter.regexen.validMentionOrList,
    (match, before, acct, instance, offset, chunk) => {
      let after = chunk.slice(offset + match.length)
      if(after.match(twitter.regexen.endMentionMatch))
        return

      if(instance)
        acct += `@${instance}`

      possibleNames.push({
        acct: acct,
        indices: [offset + before.length, offset + match.length - before.length + 1],
      })
    }
  )

  return possibleNames
}


export function parseMastodonHtml(content, mentions=[]) {
  const parser = function* (content) {
    for(const token of _expandMastodonStatus(content)) {
      if(typeof token === 'string') {
        for(const t of _parsePlainText(token))
          yield t
        // yield {type: TOKEN_TEXT, text: token}
      } else {
        yield token
      }
    }
  }

  const tokens = []

  for(let token of parser(content)) {
    if(token.type === TOKEN_MENTION) {
      // 対応するmentionが見つからなければtextにしておく
      if(!mentions || !mentions.find((m) => m.acct === token.acct)) {
        token = {type: TOKEN_TEXT, text: _stripTags(token.source)}
      }
    }
    tokens.push(token)
  }

  // decode all text entities
  for(let token of tokens) {
    if(token.type === TOKEN_TEXT) {
      token.text = AllHtmlEntities.decode(token.text)
    }
  }


  return tokens
}


/**
 * Mastodonのstatusはhtmlで返されるが、その際、mentionのホスト名を省略する。
 * つまり`@shn@oppai.tokyo @shn@friends.nico`というstatusは `<...>@shn</...> <...>@shn</...>`となる。
 * なので、単純にタグ除去だけを行うと正しく動かないので、tagの中身を見ながら展開する必要がある
 *
 * あと一部、というかfriends.nicoがニコニコ動画のURLのホスト名を省略しやがったりするので、それも正す
 *
 * @param {string} content
 */
function* _expandMastodonStatus(content) {
  // かなり雑なhtmlパーサ
  // TODO: TAG_REX使いまわしてるからyieldの間に値変わるじゃん...
  let startpos
  let endpos

  for(let idx=0; idx<10; ++idx) {
    startpos = TAG_REX.lastIndex
    const match = TAG_REX.exec(content)
    if(!match)
      break

    const tag = match[1].toLowerCase()
    const attrs = match[2] ? match[2].toLowerCase().trim() : ''
    endpos = TAG_REX.lastIndex

    if(startpos !== match.index)
      yield content.substring(startpos, match.index)

    if(tag === 'br') {
      yield {
        type: TOKEN_BREAK,
        source: content.substring(match.index, endpos),
      }
    } else if(tag === 'span' && attrs.indexOf('class="h-card"') >= 0) {
      // is h-card -> mention
      const mentionMatch = HTML_MENTION_REX.exec(content.substring(match.index + match[0].length))
      if(mentionMatch) {
        // validate mention
        const url = new URL(mentionMatch[1])
        const screenName = mentionMatch[2]
        if(url.pathname === `/@${screenName}`) {
          // this is mention!!!
          endpos = endpos + mentionMatch[0].length
          yield {
            type: TOKEN_MENTION,
            acct: `${screenName}@${url.hostname}`,
            source: content.substring(match.index, endpos),
          }
        } else {
          console.error('this is not mention!', mentionMatch)
        }
      } else {
        console.error('this is not mention!!', content.substring(match.index + match[0].length))
        console.log(content)
      }
    } else if(tag === 'a') {
      const parsed = []
      let attrMatch
      while(attrMatch = ATTR_REX.exec(attrs)) {
        parsed.push([attrMatch[1].toLowerCase(), attrMatch[2]])
      }
      const href = parsed.find(([key, val]) => key === 'href')

      if(href) {
        try {
          const url = new URL(href[1])
          if(url.protocol === 'https:' || url.protocol === 'http:') {
            END_A_TAG_REX.lastIndex = endpos
            const endMatch = END_A_TAG_REX.exec(content)
            endpos = endMatch ? endMatch.index + endMatch[0].length : content.length

            require('assert')(endpos >= TAG_REX.lastIndex)

            yield {
              type: TOKEN_URL,
              url: url.href,
              source: content.substring(match.index, endpos),
            }
          } else {
            console.log('not http url', url.protocol, href[1])
          }
        } catch(e) {
          // invalid URL, ignore error
          console.error(e, href)
        }
      } else {
        console.error('no href found')
      }
    } else {
      // ignore unknown tag
    }

    TAG_REX.lastIndex = endpos
  }

  if(startpos !== content.length)
    yield content.substring(startpos)
}


function _parsePlainText(content) {
  content = content.replace('\r\n', '\n')
  if(content.search(TAG_REX) >= 0) {
    // may be html
    content = content.replace(BR_REX, '\n').replace(TAG_REX, '')
  }

  // options = {extractUrlsWithoutProtocol: true} がデフォルト値。これしかない模様
  const entities = twitter.extractEntitiesWithIndices(content, {})

  if(entities.length === 0) {
    return _splitText(content)
  }

  let lastpos = 0
  return entities.reduce((tokens, entity) => {
    const {indices: [start, end]} = entity
    const source = content.substring(start, end)

    if(lastpos !== start) {
      tokens.push({type: TOKEN_TEXT, text: content.substring(lastpos, start)})
    }

    if(entity.url) {
      tokens.push({type: TOKEN_URL, url: entity.url, source})
    } else if(entity.acct) {
      tokens.push({
        type: TOKEN_MENTION, acct: entity.acct, source,
      })
    } else if(entity.hashtag) {
      tokens.push({type: TOKEN_HASHTAG, tag: entity.hashtag, source})
    } else {
      console.error('unknown entity type: ', entity)
      tokens.push({type: TOKEN_TEXT, text: content.substring(start, end)})
    }

    lastpos = end
    return tokens
  }, [])
}


function _splitText(text) {
  const tokens = text.split('\n').reduce((tokens, substring) => {
    tokens.push(
      {type: TOKEN_TEXT, text: substring},
      {type: TOKEN_BREAK}
    )
    return tokens
  }, [])
  tokens.pop()
  return tokens
}


function _stripTags(html) {
  return html.replace(TAG_REX, '')
}
