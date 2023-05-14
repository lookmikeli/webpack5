const path = require('path')
// 1.导入 html-webpack-plugin 插件  得到构造函数
const HtmlPlugin = require('html-webpack-plugin')
// 2.创建插件的实例对象
const htmlplugin = new HtmlPlugin({
  // 要复制文件的路径
  template: './src/index.html',
  // 复制的文件放到那个文件夹下，叫什么名字
  filename: './index.html'
})

module.exports = {
  // production
  // mode 模式;  development 开发模式
  mode: 'development',
  // 运行时报错的行数与源代码的行数报错一致
  // eval-source-map 仅限在开发环境下使用
  // devtool: 'eval-source-map',
  devtool: 'nosources-source-map',
  // 指定打包的入口
  entry: path.join(__dirname, './src/index.js'),
  // 指定打包的出口
  output: {
    // 表示输出文件的存放路径
    path: path.join(__dirname, './dist'),
    // 表示输出文件的名称
    filename: 'js/bundle.js',
    clean: true // 自动将上次打包目录资源清空
  },
  // 设置访问端口和域名 IP 静态资源
  // 对 webpack-dev-server 插件进行更多的配置
  devServer: {
    // static: './src/' // 允许配置从根目录下提供静态文件
    open: true,
    host: '127.0.0.1',
    port: 80
  },
  module: {
    // 文件后缀名的匹配规则
    rules: [
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
      { test: /\.less$/, use: ['style-loader', 'css-loader', 'less-loader'] },
      {
        test: /\.png|jpg|gif$/,
        type: 'asset', // 相当于使用了 url-loader 来帮我们处理图片
        parser: {
          dataUrlCondition: {
            maxSize: 10 * 1024 // 10kb
          }
        },
        // 指定图片输出路径 hash值
        generator: {
          // 将图片文件输出到 images 目录中
          // 将图片文件命名 [hash:8][ext][query]
          // [hash:8]: hash值取8位
          // [ext]: 使用之前的文件扩展名
          // [query]: 添加之前的query参数
          filename: 'images/[hash:8][ext][query]'
        }
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          // 配置项
          options: {
            // presets 智能预设
            presets: ['@babel/preset-env']
            // plugins 插件
            // plugins: ['@babel/plugin-transform-runtime']
          }
        }
      }
    ]
  },
  // 插件节点
  plugins: [htmlplugin] // 3.挂载插件的实例对象
  // 所有第三方文件模块的匹配规则
}
