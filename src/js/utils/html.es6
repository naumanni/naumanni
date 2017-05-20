import twitter from 'twitter-text'
import htmlparser from 'htmlparser2'

import {
  TOKEN_TEXT, TOKEN_BREAK, TOKEN_URL, TOKEN_MENTION, TOKEN_HASHTAG,
} from 'src/constants'


const BR_REX = /<br(\s+\/)?>/ig
const TAG_REX = /<\s*(\/?\w+)(?:\s+(.*?))?>/g

const anchorRegex = {
  mention: {
    href: /https?:\/\/([^/]+)\/@([a-zA-Z0-9_]+)/,
    text: /@([a-zA-Z0-9_]+)(@[a-zA-Z0-9\.\-]+[a-zA-Z0-9]+)?/,
  },
}


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


const TAG_A = 'a'
const TAG_BR = 'br'
const TAG_P = 'p'
const TAG_SPAN = 'span'

/**
 * Mastodonのstatusはhtmlで返されるが、その際、mentionのホスト名を省略する。
 * つまり`@shn@oppai.tokyo @shn@friends.nico`というstatusは `<...>@shn</...> <...>@shn</...>`となる。
 * なので、単純にタグ除去だけを行うと正しく動かないので、tagの中身を見ながら展開する必要がある
 *
 * あと一部、というかfriends.nicoがニコニコ動画のURLのホスト名を省略しやがったりするので、それも正す
 *
 * また、空行を1個以上はさむと、<p></p>で段落を分けて、見かけ上、空行1個にまとめられているような感じになるので、それにも倣う
 *
 * @param {string} content
 * @return {Token[]}
 */
function _expandMastodonStatus(content) {
  const tokens = []
  const tagStack = []

  const _push = (type, params) => tokens.push({type, ...params})

  const reformatter = new htmlparser.Parser({
    onopentag(name, attributes) {
      tagStack.unshift({name, attributes})
    },

    ontext(text) {
      const closest = tagStack.find(({name}) => ['a', 'p'].indexOf(name) >= 0)

      if(!closest) {
        // plain text?
        tokens.push(..._parsePlainText(text))
      } else if(closest.name === TAG_P) {
        _push(TOKEN_TEXT, {text: text})
      } else if(closest.name === TAG_A) {
        closest.text = (closest.text || '') + text
      } else {
        console.warn('missing text', text, '@', closest, ':', content)
      }
    },

    onclosetag(name) {
      const tag = tagStack.shift()

      if(!(tag && tag.name === name)) {
        console.error('tag mismatch', name, '<->', tag, ':', content)
      }

      if(name === TAG_BR) {
        _push(TOKEN_BREAK)
      } else if(name === TAG_P) {
        // mastdonが空行が1個以上あると、</p><p>で分ける。naumanniでは単純にbrにしてしまえ
        _push(TOKEN_BREAK)
        _push(TOKEN_BREAK)
      } else if(name === TAG_A) {
        tokens.push(..._processAnchorTag(tag.attributes.href, tag.text))
      } else if(name === TAG_SPAN) {
        // ignore span
      } else {
        console.warn('clostag ignored', tag, ':', content)
      }
    },
  }, {
    decodeEntities: true,
  })

  reformatter.write(content)
  reformatter.end()

  return tokens
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
  return entities.reduce((tokens, entity, idx, entities, ...args) => {
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

    if(idx === entities.length - 1) {
      // laset token ... push all text
      if(lastpos < content.length) {
        tokens.push({type: TOKEN_TEXT, text: content.substring(lastpos)})
      }
    }

    return tokens
  }, [])
}


function _processAnchorTag(href, text) {
  if(!href) {
    return [{type: TOKEN_TEXT, text}]
  }

  if(text.startsWith('@')) {
    // is mention?
    const matchHref = href.match(anchorRegex.mention.href)
    const matchText = text.match(anchorRegex.mention.text)
    if(matchHref && matchText) {
      const [_1, hrefHost, hrefUsername] = matchHref
      const [_2, textUsername, textHost] = matchText

      if(hrefUsername === textUsername && (!textHost || hrefHost === textHost)) {
        return [{
          type: TOKEN_MENTION,
          acct: `${hrefUsername}@${hrefHost}`,
          source: text,
        }]
      }
    }
  }
  if(text.startsWith('#')) {
    return [{
      type: TOKEN_HASHTAG,
      tag: text.substring(1),
      url: href,
    }]
  }

  return [{
    type: TOKEN_URL,
    url: href,
    text: text,
  }]
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


export function parseMastodonHtml(content, mentions=[]) {
  const tokens =
    _expandMastodonStatus(content)
      .map((token) => {
        if(token.type === TOKEN_MENTION) {
          // 対応するmentionが見つからなければtextにしておく
          if(!mentions || !mentions.find((m) => m.acct === token.acct)) {
            token = {type: TOKEN_TEXT, text: _stripTags(token.source)}
          }
        }
        return token
      })

  // trim tail breaks
  while(tokens.length && tokens[tokens.length - 1].type === TOKEN_BREAK)
    tokens.pop()

  // Collapse sequential text
  for(let idx=0; idx < tokens.length - 1; ++idx) {
    if(tokens[idx].type === TOKEN_TEXT) {
      const end = tokens.findIndex(({type}, j) => j >= idx && type !== TOKEN_TEXT)
      if(end < 0 || end - 1 > idx) {
        const texts = tokens.splice(idx + 1, (end < 0 ? tokens.length : end - idx - 1))
        tokens[idx].text += texts.map(({text}) => text).join('')
      }
    }
  }

  return tokens
}
