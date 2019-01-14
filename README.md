# module-classnames-loader

`module-classnames-loader` 是一个 webpack loader. 当你需要在 react 项目里使用模块化类名时, 它能在运行时聪明的应用你的模块化类名, 从而减少你的工作量.

## 开始使用

你可这样安装: 

```bash
npm install --save-dev module-classnames-loader
```

然后在 `webpack` 里配置好 loader, 假如有如下配置:

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        use: ['babel-loader', 'module-classnames-loader'],
      },
      // 依然需要 css loader 来处理模块化
      {
        test: /\.module\.css$/,
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
    ],
  },
};
```

注意, 你应该把 `module-classnames-loader` 放到处理js文件loader的右侧. 因为它会通过分析你的 `jsx` 语法来定位类名位置. 所以务必要在 babel-loader 处理完 jsx 语法之前使用.

在你的程序代码里使用:

> **注意:** 要模块化的css文件, 务必要命名成 `*.module.css` 的形式  
> 如: 'syle.module.css',   
> [create-react-app](https://github.com/facebook/create-react-app) 正是使用这种方式来进行模块化css文件, 使用 `create-react-app` 将可以无缝衔接
> 在之后会考虑增加配置来定制[`module`] 处可以修改的字样 

**module.js**

在使用 module-classnames-loader 之前, 你可能需要使用以下方式来使用模块化类名:

```js
import React from 'resct'
import style from './style.module.css'

function Banner(){
  return (
    // 
    <div className={`${ style.name1 } ${ style.name2 }`}>...</div>
  )
}
```

而现在, 你只需要这样:

```jsx
import React from 'resct'
import './style.module.css'

function Banner(){
  return (
    // 
    <div className="name1 name2">...</div>
  )
}
```

怎么样, 是不是已经有点心跳加速了. 别急, 再看看以下用例的对比:

> 注: 为了行文方便, 我将直接使用 jsx 表示使用方式.$

假设你用了[classnames](https://github.com/JedWatson/classnames) 库:

**before**

```jsx
import style from './style.module.css'
import 'classnames'

<div 
  className={classnames{
    [style.name1]: true,
    [style.name2]: true,

  }}
>...</div>

```

**after**

```jsx
import './style.module.css'
import 'classnames'

<div 
  className={classnames{
    name1: true,
    name2: true,
  }}
>...</div>

```

事实上, 你可以随意使用表达式而无需担心:

```jsx
import './style.module.css'

let names = 'n1 n2'

<div 
  className={names + n2}
>...</div>

```

**我们在看一些你关心的问题:**

假设你有两个模块化的 css 文件:

```css

// file1.module.css

.name1{
  margin: 0;
}

// file2.module.css
.name1{
  margin: 0;
}
.name2{
  margin: 0;
}
```

我们先引入 file1.module.css :

```jsx
import './file1.module.css'

// 假设 file1.module.css 能够得到如下对象
{
  name1: wcz_Nlfc_o3
}

<div className="name1 box">...</div>

// 最终, div 的类名会变成 ======>>>

<div class="wcz_Nlfc_o3 box">...</div>

```
看到了吧, 'box' 不在模块化的类名里, 它会被原样保留.


看看我们引入了两个css文件的情况:

```jsx
import './file1.module.css'
import './file2.module.css'

// 假设 file1.module.css 能够得到如下对象
{
  name1: f1_name1,
  name2: f1_name2,
}
// 假设 file2.module.css 能够得到如下对象
{
  name1: f2_name1,
  name3: f2_name3
}

<div className="name1 name2 name3 box">...</div>

// 最终, div 的类名会变成 ======>>>

<div class="f2_name1 f1_name2 f2_name3 box">...</div>

```

这里有两个重要的点:

- 如果位于不同模块化对象的类名, 会分别查找应用
- 如果出现同名的模块化类名, 后面引入的 'css' 会覆盖前面的, 看看上面的 'name1'

如果不想被覆盖, 而只想使用 `file1.module.css` 的 'name1' 只需单独处理即可(继承上面代码):

```jsx
import s1 './file1.module.css'
import './file2.module.css'

<div class={`${s1.name1} name2 name3 box`}>...</div>

// 此时, div 会变成 =======>>>

<div class="f1_name1 f1_name2 f2_name3 box">...</div>

```