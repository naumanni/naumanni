import {Status} from 'src/models'

const mockPostStatusManaged = jest.fn((token, message) => {
  const response = {
    resolve() {
      return new Status({
        ...message,
        id_by_host: {[token.host]: 19191},
      })
    },
  }
  return Promise.resolve(response)
})


module.exports = {
  postStatusManaged: mockPostStatusManaged,

  __postStatusManaged: mockPostStatusManaged,
}
