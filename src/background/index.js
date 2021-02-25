import config from './config'
import { MSG_TYPE } from '@/constant/index'
import * as Utils from './utils'
import * as Forum from './forum'
import * as Cron from './cron'
import queue from 'queue'

const _init = function () {
  _interceptorInit()
  _addListener()
  checkCookie()

  const iframe = document.createElement('iframe')
  iframe.id = 'sandboxFrame'
  iframe.src = 'sandbox.html'
  document.body.appendChild(iframe)
}

// 截获响应，修改响应头 content-type
const _interceptorInit = function () {
  const _beforeResponseHeader = function (details) {
    if (details.url.match('noprefix')) {
      for (const p of details.responseHeaders) {
        if (p.name.toLowerCase() === 'content-type') {
          p.value = 'application/json; charset=GBK'
        }
      }

      return {
        responseHeaders: details.responseHeaders
      }
    }
  }

  if (!chrome.webRequest.onHeadersReceived.hasListener(_beforeResponseHeader)) {
    chrome.webRequest.onHeadersReceived.addListener(_beforeResponseHeader, { urls: config.urls }, ['responseHeaders', 'extraHeaders', 'blocking'])
  }
}

// 监听通信消息
const _addListener = function () {
  chrome.runtime.onMessage.addListener(function (request, sender, callback) {
    if (request.type === MSG_TYPE.GET_FOCUS) {
      Utils.getAllFocus(function (res) {
        callback && callback(res)
      })
    }
    if (request.type === MSG_TYPE.ADD_FOCUS) {
      console.log('添加关注帖子')
      console.log(request.data)
      Utils.saveFocus(request.data.tid, request.data, function () {
        Cron.startCheckImg(request.data)
        const response = { msg: '添加成功' }
        callback && callback(response)
      })
    }
    if (request.type === MSG_TYPE.DEL_FOCUS) {
      console.log('删除关注帖子')
      console.log(request.data)
      Utils.removeFocus(request.data.tid, function () {
        const response = { msg: '删除成功' }
        callback && callback(response)
      })
    }
  })
}

// 定时扫描
const intervalCheckFocus = function () {
  if (!config.intervalOpen) {
    return false
  }
  if (config.intervalCounter) {
    clearTimeout(config.intervalCounter)
  }
  config.intervalCounter = setTimeout(_de, config.intervalTime)

  function _de () {
    console.log('===自动检测开始===')
    config.lastIntervalCheck = new Date()
    const q = queue()
    Utils.getAllFocus((items) => {
      items.forEach((val) => {
        if (!val.error) {
          q.push(function (cb) {
            Cron.startCheckImg(val, function () {
              cb()
            })
          })
        }
      })
      q.start(function () {
        console.log('===检测完毕===')
        intervalCheckFocus()
      })
    })
  }
}

// 开启扫描
const openCheckFocus = function () {
  config.intervalOpen = true
  saveConfig({
    intervalOpen: config.intervalOpen
  })
  intervalCheckFocus()
}

// 关闭扫描
const cancelCheckFocus = function () {
  if (config.intervalCounter) {
    clearTimeout(config.intervalCounter)
    config.intervalCounter = null
  }
  config.intervalOpen = false
  saveConfig({
    intervalOpen: config.intervalOpen
  })
}

// 保存config到本地
const saveConfig = function (data) {
  const _config = JSON.parse(localStorage.getItem('config')) || {}
  for (const p in data) {
    _config[p] = data[p]
    config[p] = data[p]
  }
  localStorage.setItem('config', JSON.stringify(_config))
}

// 检测cookie
const checkCookie = function () {
  return new Promise((resolve) => {
    Utils.getCookie(config).then(function () {
      if (!config.ngaCookie.length || !config.ngaCookie.find((item) => item.name === 'ngaPassportCid')) {
        config.ngaUid = ''
        cancelCheckFocus()
      } else {
        config.ngaUid = config.ngaCookie.find(item => item.name === 'ngaPassportUid').value || ''
        Forum.getRegionBase().then(function () {
          if (config.intervalOpen) {
            intervalCheckFocus()
          }
        })
      }
      resolve()
    })
  })
}

chrome.runtime.onInstalled.addListener(function () {
  _init()
})

window.bg = {
  config,
  saveConfig,
  checkCookie,
  intervalCheckFocus,
  openCheckFocus,
  cancelCheckFocus,
  ...Utils,
  ...Forum,
  ...Cron
}
