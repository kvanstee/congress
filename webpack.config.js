const path = require('path');
const webpack = require('webpack');
const fs = require('fs');

/*var nodeModules = {};
fs.readdirSync('node_modules').filter(function(x) {
  return ['.bin'].indexOf(x) === -1;
}).forEach(function(mod) {
  nodeModules[mod] = 'commonjs ' + mod;
});*/

module.exports = [
  {
    name: "client",
    entry: {
      index: './src/javascripts/app.js',
    },
    plugins: [
      /*new webpack.optimize.OccurrenceOrderPlugin(),
      new WebpackMonitor({
        capture: true,
        launch: true,
      }),*/
    ],
    output: {
      filename: 'app.js',
      path: path.resolve(__dirname, 'app/public'),
    },
    mode: 'production'
  }
]

