var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var path = require('path');

module.exports = [{
    entry: 'visualization_source',
    resolve: {
        root: [
            path.join(__dirname, 'src'),
        ]
    },
    output: {
        filename: 'visualization.js',
        libraryTarget: 'amd'
    },
    externals: [
        'api/SplunkVisualizationBase',
        'api/SplunkVisualizationUtils'
    ]
},{
  entry: {
    visualization: './src/visualization.css'
  },
  output: {
    filename: '[name].css'
  },
  module: {
    loaders: [
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract("style-loader", "css-loader")
      },
      {
        test: /\.(png|jpe?g|gif|svg|eot|ttf|woff|woff2)/i,
        // More information here https://webpack.js.org/guides/asset-modules/
        type: "asset",
        loader: 'url'
      },
    ]
  },
  plugins: [
        new ExtractTextPlugin("[name].css")
    ]

}];
