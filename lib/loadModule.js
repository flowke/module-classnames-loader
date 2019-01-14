const RuleSet = require('webpack/lib/RuleSet.js');
const cachedMerge = require("webpack/lib/util/cachedMerge.js");
const asyncLib = require("neo-async");
const { getContext, runLoaders } = require("loader-runner");

const identToLoaderRequest = resultString => {
  const idx = resultString.indexOf("?");
  if (idx >= 0) {
    const loader = resultString.substr(0, idx);
    const options = resultString.substr(idx + 1);
    return {
      loader,
      options
    };
  } else {
    return {
      loader: resultString,
      options: undefined
    };
  }
};


const resolveRequestArray = (contextInfo, context, array, resolver, callback)=> {
  if (array.length === 0) return callback(null, []);
  asyncLib.map(
    array,
    (item, callback) => {
      resolver.resolve(
        contextInfo,
        context,
        item.loader,
        {},
        (err, result) => {
          if (
            err &&
            /^[^/]*$/.test(item.loader) &&
            !/-loader$/.test(item.loader)
          ) {
            return resolver.resolve(
              contextInfo,
              context,
              item.loader + "-loader",
              {},
              err2 => {
                if (!err2) {
                  err.message =
                    err.message +
                    "\n" +
                    "BREAKING CHANGE: It's no longer allowed to omit the '-loader' suffix when using loaders.\n" +
                    `                 You need to specify '${
                    item.loader
                    }-loader' instead of '${item.loader}',\n` +
                    "                 see https://webpack.js.org/migrate/3/#automatic-loader-module-name-extension-removed";
                }
                callback(err);
              }
            );
          }
          if (err) return callback(err);

          const optionsOnly = item.options
            ? {
              options: item.options
            }
            : undefined;
          return callback(
            null,
            Object.assign({}, item, identToLoaderRequest(result), optionsOnly)
          );
        }
      );
    },
    callback
  );
}

module.exports = ( {
  path, // request
  issuer, // parentRequest
  options, // compilation options
  context, // compiler context
  resolverFactory,
  parentLoaderContext,
}, callback)=>{

  let ruleSet = new RuleSet(options.defaultRules.concat(options.rules))

  const result = ruleSet.exec({
    resource: path,
    realResource: path,
    resourceQuery: "",
    issuer: issuer,
    compiler: undefined
  });

  const settings = {};
  const useLoadersPost = [];
  const useLoaders = [];
  const useLoadersPre = [];

  for (const r of result) {
    if (r.type === "use") {
      if (r.enforce === "post" && !false) {
        useLoadersPost.push(r.value);
      } else if (
        r.enforce === "pre" &&
        !false &&
        !false
      ) {
        useLoadersPre.push(r.value);
      } else if (
        !r.enforce &&
        !false &&
        !false
      ) {
        useLoaders.push(r.value);
      }
    } else if (
      typeof r.value === "object" &&
      r.value !== null &&
      typeof settings[r.type] === "object" &&
      settings[r.type] !== null
    ) {
      settings[r.type] = cachedMerge(settings[r.type], r.value);
    } else {
      settings[r.type] = r.value;
    }
  }

  let contextInfo = {
    issuer
  }

  let loaderResolver = resolverFactory.get('loader',{});

  
  // contextInfo
  // Object { issuer: "/Users/flowke/Desktop/ex-webpack/index.js", compiler: undefined }
  // compiler: undefined
  // issuer: "/Users/flowke/Desktop/ex-webpack/ind
  
  // this.context
  // /Users/flowke/Desktop/ex-webpack

  // loaderResolver
  // Resolver { _pluginCompat: SyncBailHook, fileSystem: CachedInputFileSystem, hooks: Object, … }
  // _pluginCompat: SyncBailHook { _args: Array(1), taps: Array(4), interceptors: Array(0), … }
  // fileSystem: CachedInputFileSystem { fileSystem: NodeJsInputFileSystem, _statStorage: Storage, _readdirStorage: Storage, … }
  // hooks: Object { resolveStep: SyncHook, noResolve: SyncHook, resolve: AsyncSeriesBailHook, … }
  // withOptions: options => { … }
  // __proto__: Tapable {
  //   constructor: , ensureHoo

  // const loaderResolver = this.getResolver("loader");
  asyncLib.parallel(
    [
      resolveRequestArray.bind(
        null,
        contextInfo,
        context,
        useLoadersPost,
        loaderResolver
      ),
      resolveRequestArray.bind(
        null,
        contextInfo,
        context,
        useLoaders,
        loaderResolver
      ),
      resolveRequestArray.bind(
        null,
        contextInfo,
        context,
        useLoadersPre,
        loaderResolver
      )
    ],
    (err, results)=>{
      if (err) return callback(err);
      let loaders = results[0].concat([], results[1], results[2]);

      let indx = loaders.findIndex(elt=>/css-loader/.test(elt.loader))

      loaders = loaders.slice(indx);

      runLoaders({
        resource: path,
        loaders,
        context: {
          rootContext: parentLoaderContext.rootContext
        }

      },(err, result)=>{
          if (err) callback(err)
        callback(null, result)
      })

    }
  )
  
}

// /Users/flowke / Desktop / ex - webpack / sty.module.css

// Array(2)[Object, Object]
// length: 2
// __proto__: Array(0)[, …]
// 0: Object { loader: "/Users/flowke/Desktop/ex-webpack/node_modules/styl…", options: undefined }
// 1: Object { options: Object, ident: "ref--5-

// runLoaders(
//   {
//     resource: this.resource,
//     loaders: this.loaders,
//     context: loaderContext,
//     readResource: fs.readFile.bind(fs)
//   },