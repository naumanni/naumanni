const mockPostStatusManaged = jest.fn((token, message) => {
  message.id = 19191
  return Promise.resolve(message)
})


module.exports = {
  postStatusManaged: mockPostStatusManaged,

  __postStatusManaged: mockPostStatusManaged
}
