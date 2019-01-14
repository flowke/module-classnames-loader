const fs = require('fs');
const path = require('path');

let gen = arr => {
  return arr.reduce((accu, str) => {
    return accu + str + '\r----------\r'
  }, '') + '\r================\r'
}

class Plu{
  apply(compiler){
    compiler.hooks.compilation.tap('Plu', (compilation, { normalModuleFactory })=>{

      normalModuleFactory.hooks.module.tap('Plu', (md, data)=>{
        md;
        data;
        ;
      })

      normalModuleFactory.hooks.afterResolve.tapAsync('Plu', (data)=>{
        
        data

        // parser.hooks.evaluate.for('MemberExpression').tap('nam', (ast, cmt)=>{
        //   let as = ast,
        //       cm = cmt;
        //   console.log(ast);
        //   arr.push('ast==='+JSON.stringify(ast))
        //   arr.push('cmt==='+ JSON.stringify(cmt))
        //   // return ast
        //   p
        //   let content = gen([
        //     ...arr

        //   ])

        //   fs.writeFile(path.join(__dirname, './wat.js'), content, err => {
        //     console.log(err);

        //   })
        // })

      })
    })
  }
}

module.exports = Plu