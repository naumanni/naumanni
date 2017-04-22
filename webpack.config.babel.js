/* eslint-disable require-jsdoc */
import DefinePlugin from 'webpack/lib/DefinePlugin'


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


const SOURCE_DIR = `${__dirname}/src/js`
const DEST_DIR = `${__dirname}/static`

console.log(SOURCE_DIR)

module.exports = {
  entry: {
    main: ['babel-polyfill', `${SOURCE_DIR}/main.es6`],
  },
  output: {
    path: DEST_DIR,
    filename: '[name].bundle.js',
    chunkFilename: '[id].[chunkhash].chunked.js',
  },
  module: {
    rules: [
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
    extensions: ['.es6', '.js'],
    modules: [
      SOURCE_DIR,
      'node_modules',
    ],
  },
  plugins: [
    new DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    }),
    new LoggerPlugin(),
  ],
}


if(process.env.NODE_ENV != 'production') {
  module.exports.module.rules.push(
    {
      enforce: 'pre',
      exclude: /(node_modules)/,
      loader: 'eslint-loader',
      options: {
        fix: true,
        // failOnError: true,
      },
      test: /\.es6$/,
    }
  )
}

