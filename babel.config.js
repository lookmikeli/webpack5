module.exports = {
  // 智能预设，能够编译 ES6 语法
  presets: [
    ['@babel/preset-env', {
      useBuiltIns: "usage", // 按需加载,自动引入
      corejs: 3, // 指定版本
    }]
  ],
}