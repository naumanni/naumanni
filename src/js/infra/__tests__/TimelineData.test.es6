import {Status, Account} from 'src/models'
import {TimelineData} from '../TimelineData'


const accountA = new Account({
  url: 'accountA',
})
const accountB = new Account({
  url: 'accountB',
})

const statusA = new Status({
  uri: 'statusA',
  account: accountA.uri,
  media_attachments: [],
})
const statusB = new Status({
  uri: 'statusB',
  account: accountB.uri,
  media_attachments: [],
  reblog: 'statusC',
})
const statusC = new Status({
  uri: 'statusC',
  account: accountA.uri,
  media_attachments: [],
})


function _makeMapFromModels(...models) {
  return models.reduce((map, model) => {
    map[model.uri] = model
    return map
  }, {})
}


describe('TimelineData', () => {
  it('can merge statuses', () => {
    const db = new TimelineData()
    const refs = db.mergeStatuses({
      accounts: _makeMapFromModels(accountA, accountB),
      statuses: _makeMapFromModels(statusA, statusB, statusC),
    }, [statusB.uri, statusA.uri])
    let status

    expect(refs).toHaveLength(2)
    expect(refs[0].uri).toBe(statusB.uri)
    status = refs[0].resolve()
    expect(status.uri).toBe(statusB.uri)
    const {reblog} = refs[0].expand()
    expect(reblog.uri).toBe(statusC.uri)

    expect(refs[1].uri).toBe(statusA.uri)
    status = refs[1].resolve()
    expect(status.uri).toBe(statusA.uri)

    db.decrement(refs.map((ref) => ref.uri))

    expect(db.accounts.size).toBe(0)
    expect(db.statuses.size).toBe(0)
  })
})
