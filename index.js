const types = require('@babel/types');
const parser = require('@babel/parser');
const genn = require('@babel/generator/lib/index').default;
const traverse = require('@babel/traverse').default;
const fsPath = require('path');
const loaderUtils = require('loader-utils');
const Module = require("module");
const loadModule = require('./lib/loadModule.js');

module.exports = function (source, map, meta){
  let callback = this.async();
  let ast = parser.parse(source, {
    sourceType: 'module',
    plugins: ['jsx']
  })

  let _self = this;

  let options = loaderUtils.getOptions(this) || {};

  let { identifier='module', defaultImport = false } = options;

  this.sourceMap = options.sourceMap===true;

  // 保存所有引入js的 locals
  let localsObjets = []
  // 是否已经引入 local-classname
  let hasImportLocalClassname = false
  // local-classname 的默认引入名
  let namelyName = ''

  traverse(ast, {
    ImportDeclaration: {
      enter(path){
        let localObjName = handleModuleDefaultName(path);
        if (localObjName){
          localsObjets.push(localObjName)

          if (!hasImportLocalClassname) {
            hasImportLocalClassname = true

            let uidName = path.scope.generateUidIdentifier('namely')
            namelyName = uidName.name

            path.insertBefore(genLocalClassnameImport(uidName))

          }
        }
      }
    },

    JSXAttribute:{
      enter(path){
        let isJSXClassAttr = types.isJSXIdentifier(path.node.name, {
          name: 'className'
        });
        if(!isJSXClassAttr) return

        let valuePath = path.get('value');

        // className 是一个表达式
        let isJSXExpression = valuePath.isJSXExpressionContainer()
        if (isJSXExpression) {
          let expPath = path.get('value.expression')
          let expCode = genn(expPath.node).code
          expPath.replaceWithSourceString(`${namelyName}([${localsObjets}],${expCode})`)
        }
        
        // className 是一个字符串
        let isStringLiteral = valuePath.isStringLiteral()
        if (isStringLiteral) {
          let exp = parser.parseExpression(`${namelyName}([${localsObjets}],${JSON.stringify(valuePath.node.value)})`)
          let expContiner = types.jSXExpressionContainer(exp)
          valuePath.replaceWith(expContiner)
        }

      }
    }
  })
  
  callback(null, genn(ast).code);
}


// 拿到css-loade产出的module
// 通过执行模块, 拿到内容
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

  let isCss = false;

  if (defaultImport){
    isCss = new RegExp(`\.(scss|sass|css|less)$`).test(path.node.source.value)
  }else{
    isCss = new RegExp(`\.${identifier}\.(scss|sass|css|less)$`).test(path.node.source.value)
  }
  
  // 找到需要模块化css的引入
  if (isCss) {
    let defaultImp = path.node.specifiers.find(spec => {
      return types.isImportDefaultSpecifier(spec)
    })

    // 如果没有默认导出, 就添加一个
    // 并且获得默认导出名
    if (!defaultImp) {
      let uid = path.scope.generateUidIdentifier("S")
      path.node.specifiers.unshift(types.importDefaultSpecifier(
        uid
      ))
      return uid.name
    } else {
      return defaultImp.name
    }

  }
}

function genLocalClassnameImport(identifierName){
  return types.importDeclaration(
    [
      types.importDefaultSpecifier(identifierName)
    ],
    types.stringLiteral('local-classname')
  )
}
