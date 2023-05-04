# 高级优化
---
## 介绍
`Webpack 高级配置`

所谓高级配置其实就是进行 `Webpack 优化`，让我们`代码在编译/运行时性能`更好~
我们会从以下角度来进行优化：
- 提升开发体验
- 提升打包构建速度
- 减少代码体积
- 优化代码运行性能

## 提升开发体验
### SourceMap
#### 为什么
开发时我们运行的代码是经过 `webpack 编译后的`，所有 css 和 js 合并成了一个文件，并且多了其他代码。此时如果代码运行出错那么提示代码错误位置我们是看不懂的。一旦将来开发代码文件很多，那么`很难去发现错误`出现在哪里。

所以我们需要更加`准确的错误提示`，来帮助我们更好的开发代码。

#### 是什么
`SourceMap`（源代码映射）`是一个用来生成源代码与构建后代码一一映射的文件的方案`。

它会生成一个` xxx.map` 文件，里面包含`源代码和构建后代码`每一行、每一列的`映射关系`。当`构建后代码`出错了，会通过 `xxx.map` 文件，从`构建后代码出错位置找到映射后源代码出错位置`，从而让浏览器提示源代码文件出错位置，帮助我们更快的找到错误根源。

#### 怎么用
[通过查看Webpack DevTool 文档](https://webpack.docschina.org/configuration/devtool/)可知，SourceMap 的值有很多种情况.
但实际开发时我们只需要关注两种情况即可：
- 开发模式：`cheap-module-source-map`
    - 优点：打包编译速度快，只包含行映射
    - 缺点：没有`列`映射,只关注每一行(`开发模式一行可了解错误`)
```js
module.exports = {
  // 其他省略
  mode: "development",
  devtool: "cheap-module-source-map", // cheap 只关注行
};
```
- 生产模式：`source-map`
    - 优点：包含`行/列`映射(`生产模式被编译打包需要关注列`)
    - 缺点：打包编译速度更慢
```js
module.exports = {
  // 其他省略
  mode: "production",
  devtool: "source-map", // 行列都关注
};
```
## 提升打包构建速度
### HotModuleReplacement
---
### 为什么
开发时我们修改了其中一个模块代码，`Webpack` `默认会将所有模块全部重新打包编译`，速度很慢。
所以我们需要做到`修改某个模块代码`，就只有这个模块代码需要重新打包编译，其他模块不变，这样打包速度就能很快。
### 是什么
`HotModuleReplacement`（HMR/`热模块替换`）：在程序运行中，替换、添加或删除模块，而`无需重新加载整个页面`。

### 怎么用
1. 基本配置
```js
module.exports = {
  // 其他省略
  devServer: {
    host: "localhost", // 启动服务器域名
    port: "3000", // 启动服务器端口号
    open: true, // 是否自动打开浏览器
    hot: true, // 开启HMR功能（只能用于开发环境，生产环境不需要了）
  },
};
```
> 注意：此时` css` 样式经过 style-loader 处理，`已经具备 HMR 功能`了。 但是` js `还`不行`。

2. JS 配置
- main.js
```js
// main.js
import count from "./js/count";
import sum from "./js/sum";
// 引入资源，Webpack才会对其打包
import "./css/iconfont.css";
import "./css/index.css";
import "./less/index.less";
import "./sass/index.sass";
import "./sass/index.scss";
import "./styl/index.styl";

const result1 = count(2, 1);
console.log(result1);
const result2 = sum(1, 2, 3, 4);
console.log(result2);

# // 判断是否支持HMR功能
if (module.hot) {
  // 写法一
  module.hot.accept("./js/count.js");
  // 写法二：  第二个参数，需要回调执行其他事情，可以添加
  module.hot.accept("./js/sum.js", function (sum) {
    const result2 = sum(1, 2, 3, 4);
    console.log(result2);
  });
}
#
```
上面这样写会很麻烦，所以实际开发我们会使用其他 loader 来解决。
比如：`vue-loader`, `react-hot-loader`。

## OneOf
### 为什么
打包时每个文件都会经过所有 `loader` 处理，虽然因为 `test` 正则原因实际没有处理上，但是都要过一遍。比较慢。

### 是什么
顾名思义就是只能匹配`上一个` `loader`, 剩下的就不匹配了。

### 怎么用
1. 基本配置
把``所有loader``用对象字面量的形式包裹，放入`oneOf`中
```js
...
// 配置文件
// node.js 使用 CommonJS 模块化 
module.exports = {
  // 入口 
  // 那个文件作为打包入口
  entry: './src/main.js', // 相对路径
  // 输出 打包后的文件输出到哪里
  output: {
    // 所有文件的输出路径
    // 开发模式没有输出 不需要指定输出的路径
    path: undefined,
    // 入口文件打包输出文件名
    filename: 'static/js/mian.js',
    // 自动清空上次打包结果
    // 原理：在打包前，将path整个目录清空，再进行打包
    // clean: true, 有了 devServer 写不写都没关系，因为没有输出
  },
  // 加载器 loader 帮助webpack识别不能识别的模块
  module: {
    rules: [
      // loader 的配置
  #    {
  #      // 每个文件只能被其中一个loader配置处理
  #      oneOf: [{
  #        test: /\.css$/, // 只检测 .css结尾 的文件
  #        use: [ // 执行顺序，从右到左(从下到上)
  #          "style-loader", // 将js中的css通过创建style标签的形式，显示到页面上，添加到 htnl 文件中生效
  #          "css-loader"], // 将css资源编译成commonjs的模块到 js 中
  #      },
  #      {
  #        test: /\.less$/,
  #        // loader: 'xxx', // 而 loader 只能使用一个
  #        use: [ // use 可以使用多个 loader ；
  #          'style-loader',
  #          'css-loader',
  #          'less-loader', // 将less编译成css文件
  #        ],
  #      },
  #      {
  #        test: /\.s[ac]ss$/,
  #        use: [
  #          // 将 JS 字符串生成为 style 节点
  #          'style-loader',
  #          // 将 CSS 转化成 CommonJS 模块
  #          'css-loader',
  #          // 将 Sass 编译成 CSS
  #          'sass-loader',
  #        ],
  #      },
  #      {
  #        test: /\.styl$/,
  #        use: [
  #          'style-loader',
  #          'css-loader',
  #          // 将 stylus 编译成 CSS
  #          'stylus-loader',
  #        ],
  #      },
  #      {
  #        // webpack 内置的功能
  #        test: /\.(png|jpe?g|gif|webp|svg)$/,
  #        type: 'asset', // 会转base64
  #        parser: {
  #          dataUrlCondition: {
  #            // 小于10kb的图片转为base64
  #            // 优点：减少请求数量  缺点：体积会大一点
  #            maxSize: 10 * 1024 // 10kb
  #          }
  #        },
  #        generator: {
  #          // 输出图片名称
  #          filename: 'static/images/[hash:8][ext][query]'
  #          // 将图片文件输出到 static/images 目录中
  #          // [hash:8]: hash值取8位； hash值：图片的id,唯一的
  #          // [ext]: 使用之前的文件扩展名
  #          // [query]: 添加之前的query参数 查询参数
  #        }
  #      },
  #      {
  #        test: /\.(ttf|woff2?|map3|map4|avi|rmvb)$/, // 处理其他资源
  #        type: 'asset/resource', // 文件原封不动的输出
  #        generator: {
  #          // 输出名称
  #          filename: 'static/media/[hash:8][ext][query]'
  #          // 将字体文件输出到 static/media 目录中 media 媒体
  #        }
  #      },
  #      {
  #        test: /\.js$/,
  #        exclude: /(node_modules)/, // exclude: 排除； 排除node_modules中的js文件（这些文件不处理）
  #        loader: 'babel-loader',
  #        // 可以在里面和外面写 babel.config.js 
  #        // options: {
  #        //   presets: ['@babel/preset-env']
  #        // }
  #      }]
  #    }
  #  ],
  #},
  #// 插件 拓展功能
  #plugins: [
  #  // 插件的配置
  #  // 每一个插件都是构造函数 需要 new 调用
  #  new ESLintPlugin({
  #    // 指定检查文件的根目录
  #    context: path.resolve(__dirname, '../src')
  #  }),
  #  // 调用  HtmlWebpackPlugin 插件打包html
  #  new HtmlWebpackPlugin({
  #    // 模板，以public/index.html文件创建新的html文件
  #    // 新的html文件特点：1.机构和原来一致 2.会自动引入打包输出的资源
  #    template: path.resolve(__dirname, '../public/index.html')
  #  })
  ],
  // 开发服务器：不会输出资源，在内存中编译打包的
  // 实现写完代码自动编译打包
  devServer: {
    host: "localhost", // 启动服务器域名
    port: "3000", // 启动服务器端口号
    open: true, // 是否自动打开浏览器
    hot: true, // 开启 HMR (默认值) 热模块替换
  },
  // 指定模式
  // 开发模式
  mode: 'development',
  devtool: "cheap-module-source-map",
}

```
> 生产模式也是如此配置。

## Include/Exclude
### 为什么
开发时我们需要使用第三方的库或插件，所有文件都下载到 `node_modules` 中了。而这些文件是`不需要编译`可以直接使用的。
所以我们在对 `js` 文件处理时，要`排除 node_modules` 下面的文件。

### 是什么
- include
包含，只处理 xxx 文件

- exclude
排除，除了 xxx 文件以外其他文件都处理
> 注意：两者只能选择其一
### 怎么用
- webpack.dev.js
```js
...
 {
  test: /\.js$/,
 # // exclude: /node_modules/, // 排除node_modules代码不编译
 # include: path.resolve(__dirname, "../src"), // 也可以用包含
  loader: "babel-loader",
 },
...
 plugins: [
    new ESLintWebpackPlugin({
      // 指定检查文件的根目录
      context: path.resolve(__dirname, "../src"),
     # exclude: "node_modules", // 默认值   排除 node_modules 文件 
    }),
  ],
...  
```
> 生产模式文件同理 

## Cache
### 为什么
每次打包时 `js` 文件都要经过 `Eslint` 检查 和 `Babel` 编译，`速度比较慢`。
我们可以缓存之前的 `Eslint` 检查 和 `Babel` 编译结果，这样第`二次`打包时`速度就会更快`了。

### 是什么
对 `Eslint` 检查 和 `Babel` 编译结果进行缓存。

### 怎么用
```js
{
 test: /\.js$/,
 // exclude: /(node_modules)/, // exclude 方式:  排除； 排除node_modules中的js文件（这些文件不处理）
 include: path.resolve(__dirname, "../src"), // include 方式： 只处理src下的文件，其他文件不处理
 loader: 'babel-loader',
  // 可以在里面和外面写 babel.config.js 
  options: {
   // presets: ['@babel/preset-env']，
  # cacheDirectory: true, // 开启babel缓存
  # cacheCompression: false, // 关闭缓存文件压缩
   }
 }
 ...
 new ESLintPlugin({
      context: path.resolve(__dirname, '../src'),
      exclude: "node_modules", 
    #  cache: true, // 开启缓存
    #  cacheLocation: path.resolve(__dirname, '../node_modules/.cache/eslintcache'),
  }),
```
> 生产模式文件同理      

## thread 
### 为什么
当项目越来越庞大时，打包速度越来越慢，甚至于需要一个下午才能打包出来代码。这个速度是比较慢的。
我们想要继续`提升打包速度`，其实就是要提升 `js` 的打包速度，因为其他文件都比较少。
而对 `js` 文件处理主要就是 `eslint` 、`babel`、`Terser` 三个工具，所以我们要提升它们的`运行速度`。
我们可以`开启多进程`同时处理 `js` 文件，这样速度就比之前的单进程打包更快了。

### 是什么
`多进程打包`：开启电脑的`多个进程`同时干一件事，速度更快。
需要注意：**请仅在特别耗时的操作中使用，因为每个进程启动就有大约为 600ms 左右开销。**

### 怎么用
我们启动进程的数量就是我们 CPU 的核数。

1. 如何获取 CPU 的核数，因为每个电脑都不一样。
```js
// nodejs核心模块，直接使用
const os = require("os");
// 获取 CPU 核数
const threads = os.cpus().length
```
2. 下载包
```
npm i thread-loader -D
```
3. 使用
```js
#// 导入 os 
const os = require('os')
...
#// 压缩插件内置
const TerserWebpackPlugin = require('terser-webpack-plugin')

#// 获取 CPU 核数
const threads = os.cpus().length

function getStyleLoader(pre) {
  return [
    MiniCssExtractPlugin.loader, 
    "css-loader", 
    {
      loader: "postcss-loader",
      options: { 
        postcssOptions: {
          plugins: [
            "postcss-preset-env", 
          ],
        },
      },
    },
    pre,
  ].filter(Boolean)  
}

// 配置文件
module.exports = {
  entry: './src/main.js', 
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: 'static/js/mian.js',
    clean: true,
  },
  module: {
    rules: [
      // loader 的配置
      ...
        {
          test: /\.js$/,
          include: path.resolve(__dirname, "../src"),
        #  use: [
            {
              loader: 'thread-loader', // 开启多进程
              options: {
                works: threads, // 进程数量
              },
            },
            {
              loader: "babel-loader",
              options: {
                cacheDirectory: true, 
                },
              },
          ]
        }]
  },
  plugins: [
    new ESLintPlugin({
      context: path.resolve(__dirname, '../src'),
      exclude: "node_modules", 
      cache: true,
      cacheLocation: path.resolve(__dirname, '../node_modules/.cache/eslintcache'),
    #  threads, // 开启多进程和设置进程数量
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, '../public/index.html')
    }),
    new MiniCssExtractPlugin({
      filename: 'static/css/main.css',
    }),
   # // 直接调用 css压缩
    // new CssMinimizerPlugin(),
    // new TerserWebpackPlugin({
    //   parallel: threads, // 开启多进程和设置进程数量
    // })
  ],
 # optimization: {
    // 压缩的操作
    minimizer: [
      // css 压缩
      new CssMinimizerPlugin(),
      // js 压缩
      new TerserWebpackPlugin({
        parallel: threads, // 开启多进程和设置进程数量
      })
    ],
  },
  // 生产模式
  mode: 'production',
  devtool: "source-map",
}
```
> 注意：开发模式开启线程同理，`开发模式没有压缩不需要处理`

## 减少代码体积
### Tree Shaking
#### 为什么
开发时我们定义了一些工具函数库，或者引用第三方工具函数库或组件库。
如果没有特殊处理的话我们打包时会引入整个库，但是实际上可能我们可能只用上极小部分的功能。
这样将整个库都打包进来，体积就太大了。

#### 是什么
`Tree Shaking` 是一个术语，通常用于`描述移除 JavaScript 中的没有使用上的代码`。
注意：它`依赖` `ES Module`。

#### 怎么用
`Webpack` 已经`默认`开启了这个功能，`无需其他配置`。


### Babel
#### 为什么
Babel 为`编译`的`每个文件`都插入了`辅助代码`，使代码`体积过大`！
Babel 对一些公共方法使用了非常小的辅助代码，比如 _extend。默认情况下会被添加到每一个需要它的文件中。
你可以将这些`辅助代码`作为一个`独立模块`，来避免重复引入。

#### 是什么
`@babel/plugin-transform-runtime`: 禁用了 Babel 自动对每个文件的 runtime 注入，而是引入 `@babel/plugin-transform-runtime` 并且使所有辅助代码从这里引用。

#### 怎么用
1. 下载包
```
npm i @babel/plugin-transform-runtime -D
```
2. 配置
```js
{
  test: /\.js$/,
  include: path.resolve(__dirname, "../src"), 
  use: [
     {
       loader: 'thread-loader', 
       options: {
          works: threads,
        },
     },
      {
       loader: 'babel-loader',
       options: {
        cacheDirectory: true, 
        cacheCompression: false, 
      #  plugins: ["@babel/plugin-transform-runtime"], // 减少代码体积
       }
     }
  ]
}
```
> 开发模式同理

### Image Minimizer
#### 为什么
开发如果项目中引用了较多图片，那么图片体积会比较大，将来请求速度比较慢。
我们可以对`图片进行压缩`，减少图片体积。
**注意：如果项目中图片都是在线链接，那么就不需要了。本地项目静态图片才需要进行压缩。**
#### 是什么
`image-minimizer-webpack-plugin`: 用来`压缩图片`的插件

#### 怎么用
1. 下载包
```
npm i image-minimizer-webpack-plugin imagemin -D
```
还有剩下包需要下载，有`两种模式`：
- 无损压缩
```
npm install imagemin-gifsicle imagemin-jpegtran imagemin-optipng imagemin-svgo -D
```
- 有损压缩
```
npm install imagemin-gifsicle imagemin-mozjpeg imagemin-pngquant imagemin-svgo -D
```
2. 配置
无损压缩配置为例：
```js
const ImageMinimizerPlugin = require("image-minimizer-webpack-plugin");
...
optimization: {
  minimizer: [
      // css压缩也可以写到optimization.minimizer里面，效果一样的
      new CssMinimizerPlugin(),
      // 当生产模式会默认开启TerserPlugin，但是我们需要进行其他配置，就要重新写了
      new TerserPlugin({
        parallel: threads, // 开启多进程
      }),
     # // 压缩图片
      new ImageMinimizerPlugin({
        minimizer: {
          implementation: ImageMinimizerPlugin.imageminGenerate,
          options: {
            plugins: [
              ["gifsicle", { interlaced: true }],
              ["jpegtran", { progressive: true }],
              ["optipng", { optimizationLevel: 5 }],
              [
                "svgo",
                {
                  plugins: [
                    "preset-default",
                    "prefixIds",
                    {
                      name: "sortAttrs",
                      params: {
                        xmlnsOrder: "alphabetical",
                      },
                    },
                  ],
                },
              ],
            ],
          },
       },
   # }),
  ],
},
```

## 优化代码运行性能
### Code Split
####  为什么
打包代码时会将所有` js 文件打包到一个文件中`，体积太大了。我们如果只要渲染首页，就应该`只`加载`首页`的 `js` 文件，其他文件不应该加载。

所以我们需要将打包生成的文件进行`代码分割`，生成多个 js 文件，渲染哪个页面就只加载某个 js 文件，这样加载的资源就少，速度就更快。

> `主要实现按需加载`
#### 是什么
代码分割（Code Split）主要做了两件事：
  1. 分割文件：将打包生成的文件进行`分割`，生成多个 js 文件。
  2. `按需加载`：需要哪个文件就加载哪个文件。

#### 怎么用
代码分割实现方式有不同的方式，为了更加方便体现它们之间的差异，我们会分别创建新的文件来演示

##### 1. 多入口
1. 文件目录
```
├── public
├── src
|   ├── app.js
|   └── main.js
├── package.json
└── webpack.config.js
```
2. 下载包
```
npm i webpack webpack-cli html-webpack-plugin -D
```
3. 新建文件
内容无关紧要，主要观察打包输出的结果
- app.js
```js
console.log("app.js")
```
- main.js
```js
console.log('main.js')
```
4. 配置
- webpack.config.js
```js
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
module.exports = {
  // 入口文件
  // entry: './src/main.js', // 只要一个入口文件，单入口
  // 多入口
  entry: {
    app: './src/app.js',
    main: './src/main.js',
  },
  // 输出
  output: {
    path: path.resolve(__dirname, 'dist'),
    // [name]是webpack命名规则，使用chunk的name作为输出的文件名。
    // 什么是chunk？打包的资源就是chunk，输出出去叫bundle。
    // chunk的name是啥呢？ 比如： entry中xxx: "./src/xxx.js", name就是xxx。注意是前面的xxx，和文件名无关。
    // 为什么需要这样命名呢？如果还是之前写法main.js，那么打包生成两个js文件都会叫做main.js会发生覆盖。(实际上会直接报错的)
    filename: '[name].js', // webpack 的命名方式； [name]以 入口 文件名自己命名
  },
  plugins: [
    new HtmlWebpackPlugin({
      // 指定目录
      template: path.resolve(__dirname, 'public/index.html'),
    })
  ],
  // 指定模式
  mode: 'production',
}
```
5. 运行指令
```
npx webpack
```
此时在 dist 目录我们能看到输出了两个 js 文件。
> 总结：配置了`几个入口`，至少`输出`几个 `js` 文件。

##### 2. 提取重复代码  多入口
如果`多入口文件`中都`引用了同一份代码`，我们不希望这份代码被打包到两个文件中，导致代码重复，体积更大。
我们需要提取多入口的`重复代码`，只打包生成一个 `js` 文件，其他文件引用它就好。

1. 修改文件
- app.js `入口文件1`
```js
import { sum } from './math.js' // 引用同一个文件 math.js
console.log('app.js')
console.log(sum(1, 2, 3, 4, 5))
```
- main.js `入口文件2`
```js
import { sum } from "./math.js"; // 引用同一个文件 math.js
console.log(sum(1, 2, 3, 4))
console.log('main.js')
```
- math.js `公共文件`
```js
export function sum(...args) {
  return args.reduce((start, last) => start + last, 0)
} 
```
2. 修改配置文件
- webpack.config.js
```js
// webpack.config.js
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  // 单入口
  // entry: './src/main.js',
  // 多入口
  entry: {
    main: "./src/main.js",
    app: "./src/app.js",
  },
  output: {
    path: path.resolve(__dirname, "./dist"),
    // [name]是webpack命名规则，使用chunk的name作为输出的文件名。
    // 什么是chunk？打包的资源就是chunk，输出出去叫bundle。
    // chunk的name是啥呢？ 比如： entry中xxx: "./src/xxx.js", name就是xxx。注意是前面的xxx，和文件名无关。注：会把例如 xxx.js 依赖的资源打包成功为一个模块
    // 为什么需要这样命名呢？如果还是之前写法main.js，那么打包生成两个js文件都会叫做main.js会发生覆盖。(实际上会直接报错的)
    filename: "js/[name].js",
    clean: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./public/index.html",
    }),
  ],
  mode: "production",
  // 所有涉及到压缩代码，优化
 # optimization: {
    // 代码分割配置
    splitChunks: {
      chunks: "all", // 对所有模块都进行分割
      // 以下是默认值
      // minSize: 20000, // 分割代码体积最小是多少  单位：千字节
      // minRemainingSize: 0, // 类似于minSize，最后确保提取的文件大小不能为0
      // minChunks: 1, // 至少被引用的次数，满足条件才会代码分割
      // maxAsyncRequests: 30, // 按需加载时并行加载的文件的最大数量
      // maxInitialRequests: 30, // 入口js文件最大并行请求数量
      // enforceSizeThreshold: 50000, // 超过50kb一定会单独打包（此时会忽略minRemainingSize、maxAsyncRequests、maxInitialRequests）

     # /*  以上是公共配置，下面组的配置相同，会把上面的覆盖 */
      // cacheGroups: { // 组，哪些模块要打包到一个组  注：默认两个组 defaultVendors 、 default
      //   defaultVendors: { // 组名
      //     test: /[\\/]node_modules[\\/]/, // 需要打包到一起的模块
      //     priority: -10, // 权重（越大越高）
      //     reuseExistingChunk: true, // 如果当前 chunk 包含已从主 bundle 中拆分出的模块，则它将被重用，而不是生成新的模块
      //   },

      //   default: { // 其他没有写的配置会使用上面的默认值
      //     minChunks: 2, // 这里的minChunks权重更大
      //     priority: -20,
      //     reuseExistingChunk: true,
      //   },
      // },

      // 修改配置
      cacheGroups: {
        // 组，哪些模块要打包到一个组
        // defaultVendors: { // 组名
        //   test: /[\\/]node_modules[\\/]/, // 需要打包到一起的模块
        //   priority: -10, // 权重（越大越高）
        //   reuseExistingChunk: true, // 如果当前 chunk 包含已从主 bundle 中拆分出的模块，则它将被重用，而不是生成新的模块
        // },
        default: {
          // 其他没有写的配置会使用上面的默认值
          minSize: 0, // 我们定义的文件体积太小了，所以要改打包的最小文件体积
          minChunks: 2,
          priority: -20,
       #   reuseExistingChunk: true,
        },
      },
    },
  },
};
```
> 注意：实际开发使用默认组就行
3. 运行指令
```
npx webpack
```
此时我们会发现生成 3 个 js 文件，其中有一个就是提取的公共模块。

##### 3. 按需加载，动态导入
想要`实现按需加载，动态导入模块`。还需要额外配置：

1. 修改文件
- main.js 入口文件
```js
import { sum } from "./math.js";
// import count from "./count.js";

console.log(sum(1, 2, 3, 4))
console.log('main.js')

document.getElementById('btn').onclick = function () {
  // import 动态导入, 会将动态导入的文件，拆分成单独的模块，单独在需要的时候自动加载，
  // 即使只被引用了一次，也会代码分割
  // 返回值是一个 promise 对象
  import('./count.js')
    .then((value) => {
      console.log('模块加载成功了', value.default(5, 6))
    })
    .catch((reason) => {
      console.log('模块加载失败了', reason)
    })
}
```
- app.js
```js
console.log('app.js')
```
- public/index.html 静态html文件
```html
...
<body>
  <h1>hello webpack</h1>
  <button id="btn">点击计算</button>
</body>
...
```
2. 运行指令
```
npx webpack
```
我们可以发现，一旦`通过 import 动态导入语法导入模块`，`模块就被代码分割，同时也能按需加载了`。

##### 4. 单入口 + 代码分割+动态导入方式来进行配置。更新之前的配置文件。
开发时我们可能是`单页面应用`（SPA），只有`一个入口`（`单入口`）。那么我们需要这样配置：
1. 配置文件
- webpack.prod.js
```js
optimization: {
    // 压缩的操作
    minimizer: [
      // css 压缩
      new CssMinimizerPlugin(),
      // js 压缩
      new TerserWebpackPlugin({
        parallel: threads, // 开启多进程和设置进程数量
      })
    ],
   # // 代码分割配置
    splitChunks: {
      chunks: 'all', // 对所有模块都进行分割
      // ...其他都用默认值
    },
  },
```
2. 入口文件按需导入
- main.js
```js
document.getElementById('btn').onclick = function () {
  // eslint 不能识别动态导入语法，需要额外追加配置
  import('./js/math').then(({ mul }) => {
    console.log(mul(5, 8))
  })
}
```
3. eslintrc.js 配置 解决动态导入
```js
module.exports = {
  extends: ["eslint:recommended"],
  env: {
    node: true, 
    browser: true, 
  },
  parserOptions: {
    ecmaVersion: 6,
    sourceType: "module",
  },
  rules: {
    "no-var": 2,
  },
 # plugins: ["import"], // 解决动态导入语法
};
```

##### 6. 给动态导入文件取名称
1. 修改文件
- main.js
```js
...
document.getElementById('btn').onclick = function () {
  // eslint 不能识别动态导入语法，需要额外追加配置
  // /* webpackChunkName: "math" */ 这是webpack动态导入模块命名的方式
  // "math"将来就会作为[name]的值显示。
  import(/* webpackChunkName: "math" */'./js/math').then(({ mul }) => {
    console.log(mul(5, 8))
  })
}
...
```
- webpack.prod.js
```js
module.exports = {
  // 入口 
  // 那个文件作为打包入口
  entry: './src/main.js', 
  output: {
    // 所有文件的输出路径
    // __dirname node.js 的变量，代表当前文件的文件夹目录
    path: path.resolve(__dirname, '../dist'), // 需要用绝对路径
    // 入口文件打包输出文件名
    filename: 'static/js/mian.js',
    // 打包输出的其他文件命名
 #  chunkFilename: 'static/js/[name].js',
    clean: true,
  },
},
```

1. 统一命名配置
- webpack.prod.js
```js
...
// 配置文件
module.exports = {
  entry: './src/main.js', 
  output: {
    path: path.resolve(__dirname, '../dist'), 
   # // 入口文件打包输出文件名
   # filename: 'static/js/[name].js',
   # // 打包输出的其他文件命名
   # chunkFilename: 'static/js/[name].chunk.js',
   # // 图片、字体等通过 type：asset 处理资源命名文件
   # assetModuleFilename: 'static/images/[hash:8][ext][query]',

    clean: true,
  },
  module: {
    rules: [
      {
        oneOf: [
        {
          test: /\.(png|jpe?g|gif|webp|svg)$/,
          type: 'asset',
          parser: {
            dataUrlCondition: {
              maxSize: 10 * 1024
            }
          },
        # // generator: {
        # // 输出图片名称
        # // filename: 'static/images/[hash:8][ext][query]'
        # // 将图片文件输出到 static/images 目录中
        # // [hash:8]: hash值取8位； hash值：图片的id,唯一的
        # // [ext]: 使用之前的文件扩展名
        # // [query]: 添加之前的query参数 查询参数
        # // },
        },
        {
          test: /\.(ttf|woff2?|map3|map4|avi|rmvb)$/, +
          type: 'asset/resource', 
         # // generator: {
         # // 输出名称
         # // filename: 'static/media/[hash:8][ext][query]'
         # // 将字体文件输出到 static/media 目录中 media 媒体
         # // },
        },
        ...
        ]
      }
    ],
  },
  plugins: [
  ...   
    // 调用  MiniCssExtractPlugin 插件 把css打包成为单独的文件
  #  new MiniCssExtractPlugin({
  #    filename: 'static/css/[name].css', // 防止多入口命名冲突
  #    chunkFilename: 'static/css/[name].chunk.css' // 设置动态导入资源的命名规范，chunk跟主文件进行区分
    }),
  ],
  ...
}
```
- webpack.dev.js 
> 开发模式其他相同，`没有css`

3. 运行命令
```
npx webpack
```
观察打包输出 js 文件名称。


## Preload / Prefetch
### 为什么
我们前面已经做了代码分割，同时会使用 `import` 动态导入语法来进行代码`按需加载`（我们也叫`懒加载`，比如`路由懒加载就是这样实现`的）。
`但`是加载速度还不够好，比如：是`用户点击按钮时才加载`这个资源的，如果资源`体积很大`，那么用户会感觉到明显`卡顿`效果。
我们想在浏览器`空闲时间`，`加载`后续需要使用的`资源`。我们就需要用上 `Preload` 或 `Prefetch` 技术。

### 是什么
  - `Preload`：告诉浏览器`立即加载`资源。`优先级高`
  - `Prefetch`：告诉浏览器在`空闲时`才开始加载资源。 `优先级低`

它们共同点：
  - 都只会加载资源，`并不执行`。
  - 都有`缓存`。

它们区别：
  - `Preload`加载优先级`高`，`Prefetch`加载优先级`低`。
  - `Preload`只能加载当`前页面需要`使用的资源，`Prefetch`可以加载`当前页面`资源，也可以加载`下一个页面`需要使用的资源。

`总结：`
  - 当前页面`优先级高`的资源用 `Preload` 加载。
  - `下一个页面`需要使用的资源用 `Prefetch` 加载。

它们的问题：`兼容性`较差。
  - 我们可以去 [Can I Use](https://caniuse.com/) 网站查询 API 的兼容性问题。
  - `Preload` 相对于 `Prefetch` 兼容性好一点。

### 怎么用
1. 下载包
```
npm i @vue/preload-webpack-plugin -D
```
2. 配置 webpack.prod.js
```js
const PreloadWebpackPlugin = require("@vue/preload-webpack-plugin");
...
plugins: [
  new HtmlWebpackPlugin(),
  new PreloadWebpackPlugin({
      // rel: 'preload', // js 使用 preload 方式去加载
      // // style 优先级最高
      // as: 'script' // 作为 script 标签的优先级去做
      rel: 'prefetch', // prefetch兼容性更差
    })
...
]
```

## Network Cache
### 为什么
将来开发时我们对`静态资源`会使用`缓存来优化`，这样浏览器第`二次请求`资源就能`读取缓存`了，`速度很快`。
`但是`这样的话就会有一个问题, 因为前后输出的`文件名是一样`的，都叫 main.js，一旦将来`发布新版本`，因为`文件名没有变化`导致浏览器会`直接`读取缓存，`不会加载新资源`，项目也就没法更新了。
所以我们从文件名入手，确保更新前后文件名不一样，这样就可以做缓存了。

### 是什么
它们`都会生成一个唯一的 hash 值`。

- fullhash（webpack4 是 hash）
每次修改`任何`一个文件，所有文件名的 hash 至都`将改变`。所以一旦修改了`任何一个`文件，`整个项目`的文件缓存都将`失效`。

- chunkhash
根据不同的`入口文件`(Entry)进行`依赖文件解析`、`构建对应`的 chunk，生成对应的哈希值。我们 js 和 css 是同一个引入，会`共享一个` hash 值。

- contenthash (推荐)
根据`文件内容`生成 `hash` 值，只有文件``内容变化``了，hash 值`才会变化`。所有文件 hash 值是`独享且不同`的。

### 怎么用
```js
module.exports = {
  entry: "./src/main.js",
  output: {
    path: path.resolve(__dirname, "../dist"), 
    // [contenthash:8]使用contenthash，取8位长度
    filename: "static/js/[name].[contenthash:8].js", // 入口文件打包输出资源命名方式
    chunkFilename: "static/js/[name].[contenthash:8].chunk.js", // 动态导入输出资源命名方式
    assetModuleFilename: "static/media/[name].[hash][ext]", // 图片、字体等资源命名方式（注意用hash）
    clean: true,
  },
  ...

  new MiniCssExtractPlugin({
      // 定义输出文件名和目录
      filename: "static/css/[name].[contenthash:8].css",
      chunkFilename: "static/css/[name].[contenthash:8].chunk.css",
    }),

  ...  
},

```
- 问题：
当我们修改 math.js 文件再重新打包的时候，因为 contenthash 原因，math.js 文件 hash 值发生了变化（这是正常的）。
但是 `main.js` 文件的 `hash` 值也发生了`变化`，这会导致 `main.js` 的`缓存失效`。明明我们只修改 `math.js`, 为什么 `main.js` 也会变身变化呢？

- 原因：
  - 更新前：`math.xxx.js`, `main.js` 引用的 `math.xxx.js`
  - 更新后：`math.yyy.js`, `main.js` 引用的 `math.yyy.js`, 文件名发生了变化，`间接导致 main.js` 也发生了变化
  `因为存在引用依赖关系,所以会导致改变`

- 解决：
将 `hash` 值`单独保管`在一个 `runtime` 文件中。
我们`最终输出`三个文件：`main、math、runtime`。当 `math` 文件发送`变化`，变化的是 `math` 和 `runtime` 文件，`main` `不变`。
`runtime` 文件`只保存`文件的 `hash` 值和它们的`引用依赖关系`，整个文件体积就比较小，所以变化重新请求的代价也小。

- 配置
```js
optimization: {
    splitChunks: {
      chunks: 'all', 
    },
    // 提取runtime文件
    runtimeChunk: {
      name: (entrypoint) => `runtime~${entrypoint.name}.js`,  // runtime文件命名规则
    }
  },
```
## #Core-js
### 为什么
过去我们使用 `babel` 对 `js` 代码进行了兼容性处理，其中使用`@babel/preset-env` 智能预设来处理兼容性问题。

它能将 `ES6` 的一些语法进行`编译转换`，比如箭头函数、点点点运算符等。但是如果是 `async` 函数、`promise` 对象、数组的一些方法（includes）等 `ES6以后推出的语法`，它没`办法处理`。

所以此时我们 `js` 代码仍然存在`兼容性问题`，一旦遇到低版本浏览器会直接报错。所以我们想要将 js `兼容性问题彻底解决`

### 是什么
core-js 是专门用来做 ES6 以及以上 API 的 polyfill。

polyfill翻译过来叫做垫片/补丁。就是用社区上提供的一段代码，让我们在不兼容某些新特性的浏览器上，使用该新特性。

### 怎么用
1. 修改 main.js
```js
// ... 省略
new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve('成功')
  }, 1000)
})
```
如果 `Eslint` 对 `Promise `报错
2. 修改配置文件(没有报错省略)
- 下载包
```
npm i @babel/eslint-parser -D
```
- .eslintrc.js
```js
 parser: "@babel/eslint-parser", // 支持最新的最终 ECMAScript 标准
```

3. 运行指令
```
npm run build
```
此时观察打包输出的 js 文件，我们发现 Promise 语法并没有编译转换，所以我们需要使用 `core-js` 来进行 `polyfill`。

4. 使用core-js
- 下载包
```
npm i core-js
```
- `方式一`: 手动全部引入
  - main.js
```js
// 完整引入 打包体积较大
import "core-js";
```
这样引入会将`所有兼容性代码`全部引入，体积太大了。我们只想引入 promise 的 `polyfill`。

- `方式二`: 手动按需引入
  - main.js
```js
// 按需加载 手动引入
import 'core-js/es/promise' // node_modules 里面的模块
```
只引入打包 promise 的 `polyfill`，打包`体积更小`。但是将来如果还想使用其他语法，我需要手动引入库很麻烦。

- `方式三`: 自动按需引入
  - main.js
```js
// 无需手动引入
```
  - babel.config.js 
```js
  module.exports = {
  // 智能预设，能够编译 ES6 语法
  presets: [
    ['@babel/preset-env', {
      // 按需加载core-js的polyfill
      useBuiltIns: "usage", // 按需加载,自动引入
      corejs: 3, // 指定版本
    }]
  ],
 }
```
此时就会自动根据我们代码中使用的语法，来`按需加载`相应的 `polyfill` 了。

## PWA
### 为什么
开发 Web App 项目，项目一旦处于`网络离线`情况，就没法访问了。
我们希望给项目提供离线体验。

### 是什么
渐进式网络应用程序(progressive web application - PWA)：是一种可以提供类似于 native app(原生应用程序) 体验的 Web App 的技术。

其中最重要的是，在 `离线(offline)` 时应用程序能够继续运行功能。

内部通过 `Service Workers` 技术实现的。

### 怎么用
1. 下载包
```
npm i workbox-webpack-plugin -D
```
2. 修改配置文件
```js
// 引入 workbox-webpack-plugin
const WorkboxPlugin = require('workbox-webpack-plugin');
...
plugins: [
  new WorkboxPlugin.GenerateSW({
        // 这些选项帮助快速启用 ServiceWorkers
        // 不允许遗留任何“旧的” ServiceWorkers
        clientsClaim: true,
        skipWaiting: true,
      }),
],
...   
```   
- 修改 main.js
```js
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        console.log("SW registered: ", registration);
      })
      .catch((registrationError) => {
        console.log("SW registration failed: ", registrationError);
      });
  });
}
```
4. 运行指令
```
npm run build
```
此时如果直接通过 VSCode 访问打包后页面，在浏览器控制台会发现 `SW registration failed`。
因为我们打开的访问路径是：`http://127.0.0.1:5500/dist/index.html`。此时页面会去请求 `service-worker.js` 文件，请求路径是：`http://127.0.0.1:5500/service-worker.js`，这样找不到会 404。

实际 `service-worker.js` 文件路径是：`http://127.0.0.1:5500/dist/service-worker.js`。

5. 解决路径问题
- 下载包
```
npm i serve -g
```
serve 也是用来启动开发服务器来部署代码查看效果的。
- 运行指令
```
serve dist
```
此时通过 serve 启动的服务器我们 service-worker 就能注册成功了。

## 总结
`4 `个角度对 webpack 和代码进行了`优化`：

1. 提升开发体验
使用 `Source Map` 让开发或上线时代码`报错`能有更加准确的错误提示。
2. 提升 webpack 提升打包构建速度
使用 `HotModuleReplacement` 让开发时只`重新编译打包`更新变化了的代码，不变的代码使用`缓存`，从而使更新速度更快。
使用 `OneOf` 让资源文件一旦被某个 `loader` `处理`了，就不会继续遍历了，打包速度更快。
使用 `Include/Exclude` 排除或`只检测某些文件`，处理的文件更少，速度更快。
使用 `Cache` 对 `eslint` 和 `babel` 处理的结果进行`缓存`，让第`二次打包`速度更快。
使用 `thread` 多进程处理 `eslint` 和 `babel` 任务，速度更快。（需要`注意`的是，进程启动通信都有开销的，要在比较多代码处理时使用才有效果）
3. 减少代码体积
使用 `Tree Shaking` `剔除`了`没有使用`的多余代码，让代码体积更小。
使用 `@babel/plugin-transform-runtime` 插件对 `babel` 进行处理，让辅助代码从中引入，而`不是每个文件`都生成辅助代码，从而体积更小。
使用 `Image Minimizer` 对项目中图片进行`压缩`，体积更小，请求速度更快。（需要注意的是，如果项目中图片都是在线链接，那么就不需要了。`本地项目静态图片`才需要进行压缩。）
4. 优化代码运行性能
使用 `Code Split` 对代码进行`分割成多个 js` 文件，从而使单个文件`体积更小`，并行加载 js 速度更快。并通过 `import` 动态导入语法进行`按需加载`，从而达到需要使用时才加载该资源，不用时不加载资源。
使用 `Preload` / ` Prefetch `对代码进行`提前加载`，等未来需要使用时就能直接使用，从而用户体验更好。
使用 `Network Cache` 能对`输出资源`文件进行更好的`命名`，将来好做缓存，从而用户体验更好。
使用 `Core-js` 对 `js` 进行`兼容性处理`，让我们代码能运行在`低版本`浏览器。
使用 `PWA` 能让代码`离线`也能访问，从而提升用户体验。