const path = require('path');


console.log(path.resolve(__dirname, './md-loader'));


module.exports = {
  entry: './index.js',
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: 'main.js'
  },
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          {
            loader: 'babel-loader',
          },
          {
            loader: path.resolve(__dirname, './md-loader')
          }
        ]
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: true
            }
          }
        ]
      }
    ]
  },
  plugins: [
    // new Plu()
  ]
}