/* eslint-disable require-jsdoc */
import path from 'path'
import DefinePlugin from 'webpack/lib/DefinePlugin'
import UglifyJsPlugin from 'webpack/lib/optimize/UglifyJsPlugin'
import {execSync} from 'child_process'


const SOURCE_DIR = `${__dirname}/src/js`
const DEST_DIR = `${__dirname}/static`

let NAUMANNI_VERSION
try {
  NAUMANNI_VERSION = process.env.NAUMANNI_VERSION || ('' + execSync('git describe')).trim()
} catch(e) {
  NAUMANNI_VERSION = require('./package.json').version
  if(process.env.NODE_ENV !== 'production')
    NAUMANNI_VERSION += 'dev'
}

class LoggerPlugin {
  apply(compiler) {
    const timestamp = () => `[${(new Date()).toLocaleString()}]`
    compiler.plugin('compile', (params) => {
      console.log('\x1b[1;36m' + '================================')
      console.log(timestamp() + ' Start compile' + '\x1b[0m')
    })
    compiler.plugin('after-emit', (params, callback) => {
      callback()
      console.log('\x1b[1;35m' + timestamp() + ' Finish compile')
      console.log('================================' + '\x1b[0m')
    })
  }
}


module.exports = {
  entry: {
    main: ['babel-polyfill', `${SOURCE_DIR}/main.es6`],
  },
  output: {
    path: DEST_DIR,
    filename: '[name].bundle.js',
    chunkFilename: '[id].[chunkhash].chunked.js',
    publicPath: '/static/',
  },
  module: {
    rules: [
      {
        enforce: 'pre',
        exclude: /(node_modules)/,
        loader: 'eslint-loader',
        options: {
          fix: true,
          // failOnError: true,
        },
        test: /\.es6$/,
      },
      {
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          cacheDirectory: true,
        },
        test: /\.es6$/,
      },
    ],
  },
  resolve: {
    alias: {
      naumanniConfig: path.resolve(__dirname, 'config.es6'),
      naumanniPlugins: path.resolve(__dirname, 'plugin_entries.es6'),
    },
    extensions: ['.es6', '.js'],
    modules: [
      SOURCE_DIR,
      'node_modules',
    ],
  },
  plugins: [
    new DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      'process.env.NAUMANNI_VERSION': JSON.stringify(NAUMANNI_VERSION),
    }),
    new LoggerPlugin(),
  ],
}


if(process.env.NODE_ENV === 'production') {
  // production
  module.exports.plugins.push(
    new UglifyJsPlugin({
      extractComments: true,
    })
  )
  const babelRule = module.exports.module.rules.find((x) => x.loader === 'babel-loader')
} else {
  // dev
  module.exports.devtool = 'source-map'
}
