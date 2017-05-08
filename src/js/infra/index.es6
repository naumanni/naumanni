import {/* Account, */OAuthApp, OAuthToken} from 'src/models'
import Database, {Metadata} from './Database'

let metadata = new Metadata()

export default async function initializeDatabase() {
  // metadata.register(Account)
  metadata.register(OAuthApp)
  metadata.register(OAuthToken)
  Database.bind(metadata)
  await Database.open(metadata)
}
