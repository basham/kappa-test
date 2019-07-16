const path = require('path')
const merge = require('webpack-merge')

const commonConfig = {
  context: path.resolve(__dirname, './src'),
  entry: {
    'db-explorer': './db-explorer.js'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, './dist')
  },
  devtool: 'source-map',
  externals: {
    'cuid': 'cuid',
    'kappa-core': 'KappaCore',
    'kappa-view-list': 'KappaViewList',
    'level': 'level',
    'lighterhtml': 'lighterhtml',
    'random-access-web': 'RandomAccessWeb',
    'rxjs': 'rxjs',
    'rxjs/ajax': 'rxjs.ajax',
    'rxjs/operators': 'rxjs.operators',
    'subleveldown': 'subleveldown',
    'when-elements': 'WhenElements'
  },
  module: {
    rules: [
      {
        resourceQuery: /external/,
        use: [
          {
            loader: 'file-loader',
            options: {
              regExp: /(node_modules\/)([\w\-]+)\//,
              name: '[2].[ext]',
              outputPath: 'vendor'
            }
          }
        ]
      }
    ]
  },
  resolve: {
    alias: {
      src: path.join(__dirname, './src')
    }
  }
}

const devConfig = merge(commonConfig, {
  devServer: {
    contentBase: [
      path.resolve(__dirname, './client'),
      path.resolve(__dirname, './dist')
    ],
    openPage: './db.html'
  }
})

const prodConfig = commonConfig

module.exports = (env, argv) =>
  argv.mode === 'production' ? prodConfig : devConfig
