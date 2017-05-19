import React from 'react'
import {storiesOf, action, linkTo} from '@kadira/storybook'

import NotificationCenter from 'src/controllers/NotificationCenter'
import SoundDriver from 'src/controllers/SoundDriver'
import {OAuthToken, Notification, Status, Account} from 'src/models'


SoundDriver.addSound('notify', 'notify.mp3')


storiesOf('Notiication', module)
  .add('Can show', () => {
    const dummyContext = {
      onChange: () => {},
      getState: () => {
        return {
          tokenState: {
            tokens: [],
          },
          preferenceState: {
            byAcct: () => {
              return {
                notifications: {
                  mention: {
                    audio: true,
                    desktop: true,
                  },
                  reblog: {
                    audio: true,
                    desktop: true,
                  },
                  favourite: {
                    audio: true,
                    desktop: true,
                  },
                  follow: {
                    audio: true,
                    desktop: true,
                  },
                },
              }
            }
          }
        }
      }
    }
    const notificationCenter = new NotificationCenter(dummyContext)
    const dummyToken = new OAuthToken({
    })
    dummyToken.attachAccount(new Account({
      acct: 'test@dummy.jp',
    }))
    const dummyAccount = new Account({
      acct: 'shn@oppai.tokyo',
      avatar: "https://ot-mastodon.s3.amazonaws.com/accounts/avatars/000/000/001/original/2408e330e310f168.png",
      display_name: "shn@oppai.tokyo✅",
    })
    const dummyStatus = new Status({
      content: "<p>恐らく、ユーザーのdisplay_nameが設定されてないからだと思います。</p>"
    })

    return (
      <div>
        <button onClick={() => {
          notificationCenter.notifyUser(
            dummyToken,
            new Notification({type: 'mention',}),
            dummyStatus,
            dummyAccount,
          )
        }}>mention</button>

        <button onClick={() => {
          notificationCenter.notifyUser(
            dummyToken,
            new Notification({type: 'reblog',}),
            dummyStatus,
            dummyAccount,
          )
        }}>reblog</button>

        <button onClick={() => {
          notificationCenter.notifyUser(
            dummyToken,
            new Notification({type: 'favourite',}),
            dummyStatus,
            dummyAccount,
          )
        }}>favourite</button>

        <button onClick={() => {
          notificationCenter.notifyUser(
            dummyToken,
            new Notification({type: 'follow',}),
            null,
            dummyAccount,
          )
        }}>follow</button>
      </div>
    )
  })
