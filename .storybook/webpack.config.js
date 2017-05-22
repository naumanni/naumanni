module.exports = function(storybookBaseConfig, configType) {
  storybookBaseConfig.entry.preview.unshift('babel-polyfill')

  storybookBaseConfig.resolve.extensions.unshift('.es6')
  storybookBaseConfig.module.loaders.push(
    {
      test: /\.es6$/,
      exclude: /node_modules/,
      loader: 'babel',
    },
    {
      test: /\.json$/,
      loader: 'json',
    }
  )

  return storybookBaseConfig;
}
