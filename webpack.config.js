const path = require('path');
const webpack = require('webpack');
const fs = require('fs');

module.exports = [
  {
    name: "client",
    entry: {
      index: './src/javascripts/app.js',
    },
    plugins: [
    ],
    output: {
      filename: 'app.js',
      path: path.resolve(__dirname, 'app/public'),
    },
    mode: 'production'
  }
]

