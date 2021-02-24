const path = require('path')
function resolve (dir) {
  return path.join(__dirname, dir)
}

module.exports = {
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
    config.resolve.alias
      .set('dist', resolve('node_modules/vue/dist/'))
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
        return args
      })
  },
  pluginOptions: {
    browserExtension: {
      componentOptions: {
        background: {
          entry: 'src/background/index.js'
        },
        contentScripts: {
          entries: {
            'content-script': [
              'src/content/index.js'
            ]
          }
        }
      }
    }
  }
}
