const types = require('@babel/types');
const parser = require('@babel/parser');
const genn = require('@babel/generator/lib/index').default;
const traverse = require('@babel/traverse').default;
const fs = require('fs');
const fsPath = require('path');
const loaderUtils = require('loader-utils');
const Module = require("module");
const loadModule = require('./libs/loadModule.js');
// console.log(genn);

let arr = []

let gen = arr=>{
  return arr.reduce((accu, str)=>{
    return accu + str + '\r----------\r'
  }, '') + '\r================\r'
}

module.exports = function (source){

  let ast = parser.parse(source, {
    sourceType: 'module',
    plugins: ['jsx']
  })

  let _self = this;
  this.cacheable = false;

  generateLocals(ast, this)
  .then(locals=>{
    locals
  })

  arr.push(genn(ast).code)

  genCodeFile(arr)

  traverse(ast, {

    VariableDeclarator: {
      enter(path){
        // arr.push('var========:'+ JSON.stringify(path.node))
        // arr.push('falu========:' + JSON.stringify(path.node.id.name === 'bb'))
        // path.node.id = types.identifier('acs')
        // if (path.node.id.name === 'aa') {
        //   // path.node.id = types.identifier('acs')

        //   // path.scope.rename('aa')
          
        // }
      }
      
      
      
    },
    JSXAttribute:{
      enter(path){


        let isJSXClassAttr = types.isJSXIdentifier(path.node.name, {
          name: 'className'
        });

        if(!isJSXClassAttr) return

        // className 是不是一个表达式
        let isJSXExpression = types.isJSXExpressionContainer(path.node.value);

        if (isJSXExpression) {

          let code = genn(path.node.value.expression).code
          
          arr.push('exp========:' + JSON.stringify(path.node))
          arr.push('exp========:' + JSON.stringify(path.node.value.expression))
          arr.push('code========:' + JSON.stringify(code))

          path.insertBefore(types.JSXAttribute(
            types.JSXIdentifier('data-new'),
            types.jSXExpressionContainer(path.node.value.expression)
          ))



        }

        if ( isJSXClassAttr) {
          let isStringLiteral = types.isStringLiteral(path.node.value)
          

          if (isStringLiteral) {

          }

          

        }
      }

    
    }
  })



  return source
}

function genCodeFile(arr){
  fs.writeFile(fsPath.join(__dirname, './wat.js'), gen(arr), err => {
    console.log(err);

  })
}

function generateLocals(ast, loaderContext){
  let _self = loaderContext;
  // 执行模块
  let execModule = (code, filename) => {
    const module = new Module(filename, loaderContext);
    module.paths = Module._nodeModulePaths(loaderContext.context);
    module.filename = filename;
    module._compile(code, filename);
    return module.exports;
  }

  let styleLocals = [];

  let resolvePromise = null;

  let p = new Promise(rv => resolvePromise=rv );

  let inputLength = 0

  traverse(ast, {
    ImportDeclaration: {
      enter(path) {
        // 找到需要模块化css的引入
        if (/\.module\.(scss|sass|css|less)$/.test(path.node.source.value)) {

          inputLength++;

          process.nextTick(()=>{
            _self.resolve(_self.context, path.node.source.value, (err, result) => {

              loadModule({
                path: result,
                context: _self.context,
                options: _self._compilation.options.module,
                issuer: _self.resourcePath,
                resolverFactory: _self._compilation.resolverFactory,
                parentLoaderContext: _self
              }, (err, result) => {

                let filename = fsPath.resolve(_self.context, fsPath.basename(path.node.source.value) + '.js');
                // 通过执行模块确定拿到对象
                let cssLocals = execModule(result.result, filename).locals;

                styleLocals.push(cssLocals);

                if (inputLength === styleLocals.length) resolvePromise(styleLocals)
              })
            })
          })
          
        }
      }
    }
  })
  return p
}

// 拿到css-loade产出的module
// 通过分析ast拿到内容
function pickLocals(source){
  let ast = parser.parse(source, {
    sourceType: 'module',
  });

  return new Promise(rv=>{
    traverse(ast, {
      AssignmentExpression: {
        enter(path) {
          let isMemberLocal = path.node.left && path.node.left.property && path.node.left.property.name === 'locals'

          let isObject = types.isObjectExpression(path.node.right)

          if (isMemberLocal && isObject) {
            rv(JSON.parse(genn(path.node.right).code))
          }
        }
      }
    })
  })
 
}


function handleModuleDefaultName(path){
  let isImportDeclaration = path.isImportDeclaration(path.node);

  if (isImportDeclaration) {

    types.assertStringLiteral(path.node.source);

    // 找到需要模块化css的引入
    if (/\.module\.(scss|sass|css|less)$/.test(path.node.source.value)) {
      let defaultImp = path.node.specifiers.find(spec => {
        return types.isImportDefaultSpecifier(spec)
      })

      // 如果没有默认导出, 就添加一个
      // 并且获得默认导出名
      if (!defaultImp) {
        path.node.specifiers.unshift(types.importDefaultSpecifier(
          types.Identifier('__MSTYLE')
        ))
        return '__MSTYLE'
      } else {
        return defaultImp.name
      }

    }
  }
}

