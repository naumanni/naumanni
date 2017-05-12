module.exports = {
  'plugins': [
    require('postcss-import'),
    require('postcss-mixins'),
    require('postcss-nested'),
    require('postcss-simple-vars'),
    require('postcss-color-function'),
    require('postcss-cssnext'),
  ],
  'autoprefixer': {
    'browsers': [
      'last 2 versions',
      'iOS >= 9.3.5',
      'Android >= 5.0',
    ],
  },
}
