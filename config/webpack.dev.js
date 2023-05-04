// 导入 os 
const os = require('os')
const path = require('path')
// 引入 ESLintPlugin 插件
const ESLintPlugin = require('eslint-webpack-plugin');
// 引入 HtmlWebpackPlugin 插件
const HtmlWebpackPlugin = require('html-webpack-plugin');

// 获取 CPU 核数
const threads = os.cpus().length

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
    filename: 'static/js/[name].js',
    // 打包输出的其他文件命名
    chunkFilename: 'static/js/[name].chunk.js',
    // 图片、字体等通过 type：asset 处理资源命名文件
    assetModuleFilename: 'static/images/[hash:8][ext][query]',
    // 自动清空上次打包结果
    // 原理：在打包前，将path整个目录清空，再进行打包
    // clean: true, 有了 devServer 写不写都没关系，因为没有输出
  },
  // 加载器 loader 帮助webpack识别不能识别的模块
  module: {
    rules: [
      // loader 的配置
      {
        // 每个文件只能被其中一个loader配置处理
        oneOf: [{
          test: /\.css$/, // 只检测 .css结尾 的文件
          use: [ // 执行顺序，从右到左(从下到上)
            "style-loader", // 将js中的css通过创建style标签的形式，显示到页面上，添加到 htnl 文件中生效
            "css-loader"], // 将css资源编译成commonjs的模块到 js 中
        },
        {
          test: /\.less$/,
          // loader: 'xxx', // 而 loader 只能使用一个
          use: [ // use 可以使用多个 loader ；
            'style-loader',
            'css-loader',
            'less-loader', // 将less编译成css文件
          ],
        },
        {
          test: /\.s[ac]ss$/,
          use: [
            // 将 JS 字符串生成为 style 节点
            'style-loader',
            // 将 CSS 转化成 CommonJS 模块
            'css-loader',
            // 将 Sass 编译成 CSS
            'sass-loader',
          ],
        },
        {
          test: /\.styl$/,
          use: [
            'style-loader',
            'css-loader',
            // 将 stylus 编译成 CSS
            'stylus-loader',
          ],
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
          // }
        },
        {
          test: /\.(ttf|woff2?|map3|map4|avi|rmvb)$/, // 处理其他资源
          type: 'asset/resource', // 文件原封不动的输出
          // generator: {
          // 输出名称
          // filename: 'static/media/[hash:8][ext][query]'
          // 将字体文件输出到 static/media 目录中 media 媒体
          // }
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
    })
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

