// 入口文件

// 完整引入 打包体积较大
// import "core-js";
// 按需加载 手动引入
// import 'core-js/es/promise'

import count from "./js/count";
import sum from "./js/sum";

// 想要 webpack 打包资源，必须要引入资源
import './css/index.css';
import './less/index.less';
import './sass/index.sass';
import './sass/index.scss';
import './stylus/index.styl';
// 引入字体文件
import './css/iconfont.css'



const result = count(3, 1)
console.log(result)
console.log(sum(1, 2, 3, 4));

document.getElementById('btn').onclick = function () {
  // eslint 不能识别动态导入语法，需要额外追加配置
  // /* webpackChunkName: "math" */ webpack 内置魔法命名
  import(/* webpackChunkName: "math" */'./js/math').then(({ mul }) => {
    console.log(mul(5, 8))
  })
}

if (module.hot) {
  // 判断是否支持热模块替换
  module.hot.accept("./js/count")
  module.hot.accept("./js/sum")
}

new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve('成功')
  }, 1000)
})

const arr = [22233, 332, 3323, 444]
console.log(arr.includes(332))

// 注册 Service Worker
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