import config from './config'

// 获取cookie
export const getCookie = function (config) {
  return new Promise((resolve) => {
    chrome.cookies.getAll({
      domain: '.nga.cn'
    }, function (cookies) {
      config.ngaCookie = []
      cookies.forEach((item) => {
        config.ngaCookie.push(item)
      })
      resolve()
    })
  })
}

// 通知
export const notifyText = function (options) {
  clearTimeout(config.notifyTimeoutId)
  if (options.closeImmediately) {
    return chrome.notifications.clear(config.notifyId)
  }

  if (!options.icon) {
    options.icon = 'icons/48.png'
  }
  if (!options.title) {
    options.title = '温馨提示'
  }
  if (!chrome.notifications.onClicked.hasListener(handleNotifyClick)) {
    chrome.notifications.onClicked.addListener(handleNotifyClick)
  }

  chrome.notifications.create(config.notifyId, {
    type: 'basic',
    title: options.title,
    iconUrl: chrome.runtime.getURL(options.icon),
    message: options.message
  })

  config.notifyTimeoutId = setTimeout(() => {
    chrome.notifications.clear(config.notifyId)
  }, parseInt(options.autoClose || 3000, 10))

  function handleNotifyClick (notificationId) {
    if (notificationId === config.notifyId) {
      chrome.tabs.create({
        url: config.optionUrl + '#/setting'
      })
      chrome.notifications.clear(config.notifyId)
    }
  }
}

const messageMap = {}

function handleMessage (event) {
  const data = event.data

  if (messageMap[data.id]) {
    messageMap[data.id](data.result)
    delete messageMap[data.id]
  }
}

// 监听 sandbox 返回的消息
window.addEventListener('message', handleMessage)

// json字符串解析
export const parseJson = function (json, callback) {
  const iframe = document.getElementById('sandboxFrame')
  const id = Math.random().toString(36).slice(-8)

  messageMap[id] = callback
  iframe.contentWindow.postMessage({
    id,
    command: 'parseJson',
    context: json
  }, '*')
}

// 获取本地数据
export const getStorage = function (keys, callback) {
  chrome.storage.local.get(Array.isArray(keys) ? keys : keys ? [keys] : keys, function (items) {
    callback && callback(items)
  })
}

// 保存本地数据
export const setStorage = function (key, value, callback) {
  const data = {}
  data[key] = value
  chrome.storage.local.set(data, function () {
    return callback && callback()
  })
}

// 删除本地数据
export const removeStorage = function (keys, callback) {
  chrome.storage.local.remove(Array.isArray(keys) ? keys : keys ? [keys] : keys, function () {
    callback && callback()
  })
}

/**
 * 关注帖子
 * @param id
 * @param data {Object} {
 *   tid: 帖子id
 *   subject: 帖子标题
 *   author: 作者
 *   postdate: 发帖时间
 *   replies: 回复数量
 * }
 * @param callback
 */
export const saveFocus = function (id, data, callback) {
  const key = `tid_${id}`
  setStorage(key, {
    imgList: [],
    newImgLength: 0,
    hasFirstCheck: false,
    checkTimes: 0,
    ...data
  }, function () {
    const txt = '关注成功'
    callback && callback(txt)
  })
}

// 取消关注
export const removeFocus = function (ids, callback) {
  const keys = Array.isArray(ids) ? ids.map(v => `tid_${v}`) : [`tid_${ids}`]
  removeStorage(keys, function () {
    callback && callback()
  })
}

// 关注列表
export const getAllFocus = function (callback) {
  getStorage(null, function (items) {
    const _arr = []
    Object.keys(items).forEach((val) => {
      if (items[val]) {
        _arr.push(items[val])
      }
    })
    callback && callback(_arr)
  })
}

// 查询关注
export const searchFocus = function (ids, callback) {
  const keys = Array.isArray(ids) ? ids.map(v => `tid_${v}`) : [`tid_${ids}`]
  getStorage(keys, function (items) {
    const _arr = []
    Object.keys(items).forEach((val) => {
      if (items[val]) {
        _arr.push(items[val])
      }
    })
    callback && callback(_arr)
  })
}

// 新图片提示
export const tipNewImg = function () {
  getAllFocus(function (arr) {
    const newObj = arr.reduce((acc, curr) => {
      return {
        newImgLength: acc.newImgLength + curr.newImgLength
      }
    }, { newImgLength: 0 })

    // 收集到新图片时，在插件图标上提示
    if (newObj.newImgLength > 0) {
      chrome.browserAction.setBadgeText({ text: `${newObj.newImgLength}` })
      chrome.browserAction.setBadgeBackgroundColor({ color: [255, 0, 0, 255] })
    } else {
      chrome.browserAction.setBadgeText({ text: '' })
    }
  })
}
