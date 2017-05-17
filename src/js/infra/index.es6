import {/* Account, */OAuthApp, OAuthToken, TalkRecord} from 'src/models'
import Database, {Metadata} from './Database'

let metadata = new Metadata()

export default async function initializeDatabase() {
  metadata.register(OAuthApp)
  metadata.register(OAuthToken)
  metadata.register(TalkRecord)
  Database.bind(metadata)
  await Database.open(metadata)
}
