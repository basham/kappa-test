const path = require('path')

module.exports = {
  context: path.resolve(__dirname, './src/vendor'),
  entry: {
    'level': './level.js',
    'subleveldown': './subleveldown.js'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, './dist/vendor')
  }
}
