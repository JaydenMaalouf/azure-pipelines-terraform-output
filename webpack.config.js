const path = require('path')
const fs = require('fs')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const webpack = require('webpack')

module.exports = {
  entry: {
    TerraformTab: './src/TerraformTab/tabContent.tsx',
    TerraformTabReleases: './src/TerraformTabReleases/tabContent.tsx',
  },
  output: {
    filename: '[name]/tabContent.js',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    alias: {
      'azure-devops-extension-sdk': path.resolve(
        'node_modules/azure-devops-extension-sdk',
      ),
    },
    fallback: {
      buffer: require.resolve('buffer'),
    },
  },
  stats: {
    warnings: false,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
      },
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          'css-loader',
          'azure-devops-ui/buildScripts/css-variables-loader',
          'sass-loader',
        ],
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new CopyWebpackPlugin([
      { from: '**/*.html', context: 'src/' },
      { from: '**/*.css', context: 'src/' },
    ]),
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),
  ],
}
