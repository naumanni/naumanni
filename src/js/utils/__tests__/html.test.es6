import {
  TOKEN_TEXT, TOKEN_BREAK, TOKEN_URL, TOKEN_MENTION, TOKEN_HASHTAG
} from 'src/constants'

import {parseMastodonHtml} from '../html'


describe('parseMastodonHtml', () => {
  it('can parse html status', () => {
    const TEST_CONTENT = '<p>ぶっちゃけ最近は尻も好きです<br />PGP Key Fingerprint: c3760e259ed09aae51d7d85e893ab07b862199c1</p>'

    const tokens = parseMastodonHtml(TEST_CONTENT, [])
    expect(tokens).toHaveLength(3)
    expect(tokens[0]).toMatchObject({type: TOKEN_TEXT, text: 'ぶっちゃけ最近は尻も好きです'})
    expect(tokens[1]).toMatchObject({type: TOKEN_BREAK})
    expect(tokens[2]).toMatchObject({type: TOKEN_TEXT, text: 'PGP Key Fingerprint: c3760e259ed09aae51d7d85e893ab07b862199c1'})
  })

  it('can parse link, tag, mention status', () => {
    const TEST_CONTENT = 'http://www.google.com/ @shn@oppai.tokyo &lt; @hogehoge #tagA #日本語tag'

    const tokens = parseMastodonHtml(TEST_CONTENT, [
      {url: "https://oppai.tokyo/@shn", acct: "shn@oppai.tokyo", id: 4182, username: "shn"},
    ])
    expect(tokens).toHaveLength(7)
    expect(tokens[0]).toMatchObject({type: TOKEN_URL, url: 'http://www.google.com/'})
    expect(tokens[1]).toMatchObject({type: TOKEN_TEXT, text: ' '})
    // mentionsを与えていないのでtextになる
    expect(tokens[2]).toMatchObject({type: TOKEN_MENTION, acct: 'shn@oppai.tokyo'})
    expect(tokens[3]).toMatchObject({type: TOKEN_TEXT, text: ' < @hogehoge '})
    // mentionsを与えていないのでtextになる
    expect(tokens[4]).toMatchObject({type: TOKEN_HASHTAG, tag: 'tagA'})
    expect(tokens[5]).toMatchObject({type: TOKEN_TEXT, text: ' '})
    expect(tokens[6]).toMatchObject({type: TOKEN_HASHTAG, tag: '日本語tag'})
  })

  it('can parse real mastodon status', () => {
    const TEST_CONTENT = '<p><span class="h-card"><a href="https://oppai.tokyo/@shn">@<span>shn</span></a></span> <span class="h-card"><a href="https://friends.nico/@shn">@<span>shn</span></a></span> <span class="h-card"><a href="https://mstdn.onosendai.jp/@shn">@<span>shn</span></a></span> どうなんだろこれ</p>'

    const tokens = parseMastodonHtml(TEST_CONTENT, [
      {url: "https://oppai.tokyo/@shn", acct: "shn@oppai.tokyo", id: 4182, username: "shn"},
      {url: "https://friends.nico/@shn", acct: "shn@friends.nico", id: 11834, username: "shn"},
      // {url: "https://mstdn.onosendai.jp/@shn", acct: "shn", id: 983, username: "shn"},
    ])

    expect(tokens).toHaveLength(4)
    expect(tokens[0]).toMatchObject({type: TOKEN_MENTION, acct: "shn@oppai.tokyo",})
    expect(tokens[1]).toMatchObject({type: TOKEN_TEXT, text: ' '})
    expect(tokens[2]).toMatchObject({type: TOKEN_MENTION, acct: "shn@friends.nico",})
    expect(tokens[3]).toMatchObject({type: TOKEN_TEXT, text: ' @shn どうなんだろこれ'})
  })

  it('can parse real friends.nico status', () => {
    const TEST_CONTENT = '<p>よかったら<br /><a href="https://nico.ms/lv297979410" rel="nofollow noopener" target="_blank"><span>lv297979410</span></a></p>'

    const tokens = parseMastodonHtml(TEST_CONTENT, [])

    expect(tokens).toHaveLength(3)
    expect(tokens[0]).toMatchObject({type: TOKEN_TEXT, text: 'よかったら'})
    expect(tokens[1]).toMatchObject({type: TOKEN_BREAK})
    expect(tokens[2]).toMatchObject({
      type: TOKEN_URL,
      url: 'https://nico.ms/lv297979410',
    })
  })

  it('can parse real pawoo.net status', () => {
    const TEST_CONTENT = '<p>@shn@mastdn.onosendai.jp <span class="h-card"><a href="https://oppai.tokyo/@shn">@<span>shn</span></a></span> <br>はなげ</p>'

    const tokens = parseMastodonHtml(TEST_CONTENT, [
      {url: "https://oppai.tokyo/@shn", acct: "shn@oppai.tokyo", id: 1, username: "shn"}
    ])

    expect(tokens).toHaveLength(5)
    expect(tokens[0]).toMatchObject({type: TOKEN_TEXT, text: '@shn@mastdn.onosendai.jp '})
    expect(tokens[1]).toMatchObject({type: TOKEN_MENTION, acct: 'shn@oppai.tokyo'})
    expect(tokens[2]).toMatchObject({type: TOKEN_TEXT, text: ' '})
    expect(tokens[3]).toMatchObject({type: TOKEN_BREAK})
    expect(tokens[4]).toMatchObject({type: TOKEN_TEXT, text: 'はなげ'})
  })

  it('can parse samples', () => {
    let tokens

    tokens = parseMastodonHtml('あぶらあげがすきです．あとジャクリン．JavaScriptとかC++書いてるかも．二回データ飛ばすことになったけど一応インスタンス運用してます: <a href="https://mstdn.jp/"><span class="invisible">https://</span><span class="">mstdn.jp/</span><span class="invisible"></span></a> Twitter: <a href="https://twitter.com/nullkal"><span class="invisible">https://</span><span class="">twitter.com/nullkal</span><span class="invisible"></span></a> 支援はこちら: <a href="https://enty.jp/nullkal"><span class="invisible">https://</span><span class="">enty.jp/nullkal</span><span class="invisible"></span></a>', [])
    expect(tokens).toHaveLength(6)

    tokens = parseMastodonHtml(`<p>若い世代の読書術　<br><a href="http://aikoumasanobu.com/"><span class="invisible">http://</span><span class="">aikoumasanobu.com/</span><span class="invisible"></span></a><br>Faceboo　<a href="https://www.facebook.com/masanobuaiko/"><span class="invisible">https://www.</span><span class="">facebook.com/masanobuaiko/</span><span class="invisible"></span></a><br>pawoo.netアカ：<a href="https://pawoo.net/@masanobu"><span class="invisible">https://</span><span class="">pawoo.net/@masanobu</span><span class="invisible"></span></a></p>`)
    expect(tokens).toHaveLength(9)

    tokens = parseMastodonHtml(`<p>タスクの消化スピード &lt; タスクの追加スピード である</p>`)
    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({type: TOKEN_TEXT, text: 'タスクの消化スピード < タスクの追加スピード である'})

    tokens = parseMastodonHtml(`<p>映画でもTogetterが登場するのか楽しみ↵<br><a href="https://t.co/fMgmqDtY65"><span class="invisible">https://</span><span class="">t.co/fMgmqDtY65</span><span class="invisible"></span></a></p>`)
    expect(tokens).toHaveLength(3)
    expect(tokens[2]).toMatchObject({type: TOKEN_URL, url: 'https://t.co/fMgmqDtY65'})

    tokens = parseMastodonHtml(`<p>【ポケモンGO】ズリ「使える」パイル「まあ使える」ナナ「ポケモンよりゴミ箱に投げるwww」<br><a href="http://matome-alpha.com/?eid=299173&amp;m=pawoo_megumin"><span class="invisible">http://</span><span class="ellipsis">matome-alpha.com/?eid=299173&amp;m</span><span class="invisible">=pawoo_megumin</span></a></p>`)
    expect(tokens).toHaveLength(3)
    expect(tokens[2]).toMatchObject({type: TOKEN_URL, url: 'http://matome-alpha.com/?eid=299173&m=pawoo_megumin'})

    tokens = parseMastodonHtml(`<p>【BABY!!BABY!!/海の家はまなす】<a href="http://nekora.main.jp/comic/thumb/tohou/all/?ID=RJ100527#RJ100527"><span class="invisible">http://</span><span class="ellipsis">nekora.main.jp/comic/thumb/toh</span><span class="invisible">ou/all/?ID=RJ100527#RJ100527</span></a> 東方Project、古明地こいしメインのサイレント漫画です <a href="https://pawoo.net/tags/5%E6%9C%8814%E6%97%A5%E3%81%AF%E3%81%93%E3%81%84%E3%81%97%E3%81%AE%E6%97%A5">#<span>5月14日はこいしの日</span></a></p>`)
    expect(tokens).toHaveLength(4)
    expect(tokens[1]).toMatchObject({type: TOKEN_URL, url: 'http://nekora.main.jp/comic/thumb/tohou/all/?ID=RJ100527#RJ100527'})

    tokens = parseMastodonHtml(`<p>「「マタ・ハリ」なでなでパイズリ」をブックマークに追加しました。<br><a href="https://www.pixiv.net/member_illust.php?illust_id=62903357&amp;mode=medium"><span class="invisible">https://www.</span><span class="ellipsis">pixiv.net/member_illust.php?il</span><span class="invisible">lust_id=62903357&amp;mode=medium</span></a><br>マタハリお姉ちゃんスコ～</p>`)
    expect(tokens).toHaveLength(5)
    expect(tokens[2]).toMatchObject({type: TOKEN_URL, url: 'https://www.pixiv.net/member_illust.php?illust_id=62903357&mode=medium'})

    tokens = parseMastodonHtml(`<p><a href="https://www.youtube.com/watch?v=4qh6UPp6m4I"><span class="invisible">https://www.</span><span class="ellipsis">youtube.com/watch?v=4qh6UPp6m4</span><span class="invisible">I</span></a></p>`)
    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({type: TOKEN_URL, url: 'https://www.youtube.com/watch?v=4qh6UPp6m4I'})

    tokens = parseMastodonHtml(`<p>いくつかバグを修正して更新しました <a href="https://oppai.tokyo/tags/naumanni">#<span>naumanni</span></a></p><p>* Websocketつなぎまくってて重かった<br>* ユーザー名を設定してない人のBoost名が表示されていなかった<br>* Fav/Boostしたらフォームを閉じるように</p>`)
    expect(tokens[1]).toMatchObject({type: TOKEN_HASHTAG, tag: 'naumanni'})
    expect(tokens[2]).toMatchObject({type: TOKEN_BREAK})
    expect(tokens[3]).toMatchObject({type: TOKEN_BREAK})
    expect(tokens[5]).toMatchObject({type: TOKEN_BREAK})
    expect(tokens).toHaveLength(9)
  })
})
