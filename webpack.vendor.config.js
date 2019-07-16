const path = require('path')

module.exports = {
  context: path.resolve(__dirname, './src/vendor'),
  entry: {
    'kappa-core': './kappa-core.js',
    'kappa-view-list': './kappa-view-list.js',
    'level': './level.js',
    'random-access-web': './random-access-web.js',
    'subleveldown': './subleveldown.js'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, './dist/vendor')
  }
}
