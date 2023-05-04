// 导入 os 
const os = require('os')
const path = require('path')
// 引入 ESLintPlugin 插件
const ESLintPlugin = require('eslint-webpack-plugin');
// 引入 HtmlWebpackPlugin 插件
const HtmlWebpackPlugin = require('html-webpack-plugin');
// 引入 MiniCssExtractPlugin 插件
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
// 引入 CssMinimizerPlugin 插件
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
// 压缩插件内置
const TerserWebpackPlugin = require('terser-webpack-plugin')
// 引入 @vue/preload-webpack-plugin
const PreloadWebpackPlugin = require('@vue/preload-webpack-plugin');
// 引入 workbox-webpack-plugin
const WorkboxPlugin = require('workbox-webpack-plugin');

// 获取 CPU 核数
const threads = os.cpus().length

// 用来获取处理样式的 loader
function getStyleLoader(pre) {
  return [
    MiniCssExtractPlugin.loader, // 提取css成单独文件
    "css-loader", // 将css资源编译成commonjs的模块到 js 中
    {
      loader: "postcss-loader",
      options: { // 对象形式可以用options给 postcss-loader 写配置；如果是默认配置，直接写名字就可以了
        postcssOptions: {
          plugins: [
            "postcss-preset-env", // 能解决大多数样式兼容性问题
          ],
        },
      },
    },
    pre,
    // 等价于 .filter(item => Boolean(item))
  ].filter(Boolean)  // 过滤 pre 没传参的undefined过滤掉
}



// 配置文件
// node.js 使用 CommonJS 模块化 
module.exports = {
  // 入口 
  // 那个文件作为打包入口
  entry: './src/main.js', // 相对路径
  // 输出 打包后的文件输出到哪里
  output: {
    // 所有文件的输出路径
    // __dirname node.js 的变量，代表当前文件的文件夹目录
    path: path.resolve(__dirname, '../dist'), // 需要用绝对路径
    // 入口文件打包输出文件名
    filename: 'static/js/[name].[contenthash:8].js',
    // 打包输出的其他文件命名
    chunkFilename: 'static/js/[name].chunk.[contenthash:8].js',
    // 图片、字体等通过 type：asset 处理资源命名文件
    assetModuleFilename: 'static/images/[hash:8][ext][query]',

    // 自动清空上次打包结果
    // 原理：在打包前，将path整个目录清空，再进行打包
    clean: true,
  },
  // 加载器 loader 帮助webpack识别不能识别的模块
  module: {
    rules: [
      // loader 的配置
      {
        // 每个文件只能被其中一个loader配置处理
        oneOf: [{
          test: /\.css$/, // 只检测 .css结尾 的文件
          use: getStyleLoader(), // 执行顺序，从右到左(从下到上)
        },
        {
          test: /\.less$/,
          // loader: 'xxx', // 而 loader 只能使用一个
          use: getStyleLoader('less-loader'), // 将less编译成css文件
        },
        {
          test: /\.s[ac]ss$/,
          use: getStyleLoader('sass-loader'), // 将 Sass 编译成 CSS
        },
        {
          test: /\.styl$/,
          use: getStyleLoader('stylus-loader'), // 将 stylus 编译成 CSS
        },
        {
          // webpack 内置的功能
          test: /\.(png|jpe?g|gif|webp|svg)$/,
          type: 'asset', // 会转base64
          parser: {
            dataUrlCondition: {
              // 小于10kb的图片转为base64
              // 优点：减少请求数量  缺点：体积会大一点
              maxSize: 10 * 1024 // 10kb
            }
          },
          // generator: {
          // 输出图片名称
          // filename: 'static/images/[hash:8][ext][query]'
          // 将图片文件输出到 static/images 目录中
          // [hash:8]: hash值取8位； hash值：图片的id,唯一的
          // [ext]: 使用之前的文件扩展名
          // [query]: 添加之前的query参数 查询参数
          // },
        },
        {
          test: /\.(ttf|woff2?|map3|map4|avi|rmvb)$/, // 处理其他资源
          type: 'asset/resource', // 文件原封不动的输出
          // generator: {
          // 输出名称
          // filename: 'static/media/[hash:8][ext][query]'
          // 将字体文件输出到 static/media 目录中 media 媒体
          // },
        },
        {
          test: /\.js$/,
          // exclude: /(node_modules)/, // exclude 方式:  排除； 排除node_modules中的js文件（这些文件不处理）
          include: path.resolve(__dirname, "../src"), // include 方式： 只处理src下的文件，其他文件不处理
          use: [
            {
              loader: 'thread-loader', // 开启多进程
              options: {
                works: threads, // 进程数量
              },
            },
            {
              // 可以在里面和外面写 babel.config.js 
              loader: 'babel-loader',
              options: {
                // presets: ['@babel/preset-env']，
                cacheDirectory: true, // 开启babel缓存
                cacheCompression: false, // 关闭缓存文件压缩
                plugins: ["@babel/plugin-transform-runtime"], // 减少代码体积
              }
            }
          ]
        }]
      }
    ],
  },
  // 插件 拓展功能
  plugins: [
    // 插件的配置
    // 每一个插件都是构造函数 需要 new 调用
    new ESLintPlugin({
      // 指定检查文件的根目录
      context: path.resolve(__dirname, '../src'),
      exclude: "node_modules", // 排除 node_modules 文件  默认值
      cache: true, // 开启缓存
      cacheLocation: path.resolve(__dirname, '../node_modules/.cache/eslintcache'),
      threads, // 开启多进程和设置进程数量
    }),
    // 调用  HtmlWebpackPlugin 插件打包html
    new HtmlWebpackPlugin({
      // 模板，以public/index.html文件创建新的html文件
      // 新的html文件特点：1.机构和原来一致 2.会自动引入打包输出的资源
      template: path.resolve(__dirname, '../public/index.html')
    }),
    // 调用  MiniCssExtractPlugin 插件 把css打包成为单独的文件
    new MiniCssExtractPlugin({
      filename: 'static/css/[name].[contenthash:8].css', // 防止多入口命名冲突
      chunkFilename: 'static/css/[name].[contenthash:8].chunk.css' // 设置动态导入资源的命名规范，chunk跟主文件进行区分
    }),
    // 直接调用 css压缩
    // new CssMinimizerPlugin(),
    // new TerserWebpackPlugin({
    //   parallel: threads, // 开启多进程和设置进程数量
    // })
    new PreloadWebpackPlugin({
      // rel: 'preload', // js 使用 preload 方式去加载
      // // style 优先级最高
      // as: 'script' // 作为 script 标签的优先级去做
      rel: 'prefetch',
    }),
    new WorkboxPlugin.GenerateSW({
      // 这些选项帮助快速启用 ServiceWorkers
      // 不允许遗留任何“旧的” ServiceWorkers
      clientsClaim: true,
      skipWaiting: true,
    }),
  ],
  optimization: {
    // 压缩的操作
    minimizer: [
      // css 压缩
      new CssMinimizerPlugin(),
      // js 压缩
      new TerserWebpackPlugin({
        parallel: threads, // 开启多进程和设置进程数量
      }),
    ],
    // 代码分割配置
    splitChunks: {
      chunks: 'all', // 对所有模块都进行分割
      // ...其他都用默认值
    },
    runtimeChunk: {
      name: (entrypoint) => `runtime~${entrypoint.name}.js`,
    }
  },
  // 指定模式
  // 生产模式
  mode: 'production',
  devtool: "source-map",
}


