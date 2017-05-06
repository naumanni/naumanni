import { configure } from '@kadira/storybook';

const req = require.context('../src/js/pages', true, /__stories__\/.*\.stories\.es6$/)

function loadStories() {
  req.keys().forEach((filename) => {
    console.log(filename)
    req(filename)
  })
}

configure(loadStories, module);
