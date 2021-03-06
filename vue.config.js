const path = require('path')
function resolve (dir) {
  return path.join(__dirname, dir)
}

module.exports = {
  productionSourceMap: false,
  pages: {
    popup: {
      template: 'public/browser-extension.html',
      entry: './src/popup/main.js',
      title: 'Popup'
    },
    options: {
      template: 'public/browser-extension.html',
      entry: './src/options/main.js',
      title: 'NGA-收图助手配置页'
    }
  },
  chainWebpack: (config) => {
    config.plugin('copy')
      .tap(args => {
        args[0].push({
          from: resolve('src/assets/js/'),
          to: resolve('dist/js/'),
          toType: 'dir'
        })
        args[0].push({
          from: resolve('src/assets/css/'),
          to: resolve('dist/css/'),
          toType: 'dir'
        })
        args[0].push({
          from: resolve('src/constant/'),
          to: resolve('dist/js/constant.js')
        })
        args[0].push({
          from: resolve('src/content/'),
          to: resolve('dist/js/content-script.js')
        })
        args[0].push({
          from: resolve('public/sandbox.html'),
          to: resolve('dist/sandbox.html')
        })
        return args
      })
  },
  pluginOptions: {
    browserExtension: {
      componentOptions: {
        background: {
          entry: 'src/background/index.js'
        }
      }
    }
  }
}
