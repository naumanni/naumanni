const mockPostStatusManaged = jest.fn((token, message) => {
  const response = {...message, id: 19191}
  return Promise.resolve(response)
})


module.exports = {
  postStatusManaged: mockPostStatusManaged,

  __postStatusManaged: mockPostStatusManaged
}
