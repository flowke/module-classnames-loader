const webpack = require('webpack');
const cfg = require('../config/webpack.config.js');

let compiler = webpack(cfg)

compiler.run((err, stats)=>{
  if (err) {
    console.error(err);
    return;
  }

  console.log(stats.toString({
    chunks: false,  // 使构建过程更静默无输出
    colors: true    // 在控制台展示颜色
  }));
  
})