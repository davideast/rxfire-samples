const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
  entry: './index.tsx',
  mode: 'development',
  output: {
    path: path.join(__dirname, '../../public/react'),
    filename: 'bundle.js'
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"]
  },
  module: {
    rules: [
      { test: /\.tsx?$/, loader: "ts-loader" }
    ]
  },
  plugins: [
    new CopyWebpackPlugin([
      'index.html'
    ])
  ]
};
