import axios from 'axios'
import qs from 'qs'
import config from './config'
import { parseJson } from './utils'

// 获取部分接口baseURL
export const getRegionBase = function () {
  return new Promise((resolve) => {
    axios.get(config.regionBaseApi).then((res) => {
      const reg = res.data.match("__IMG_BASE = '(.*)'")
      if (reg && !config.regionBase) {
        config.regionBase = reg[1]
        config.regionApi = `${reg[1]}${config.regionApi}`.replace(/^http/, 'https')
        config.faceApi = `${reg[1]}${config.faceApi}`.replace(/^http/, 'https')
        config.iconApi = `${reg[1]}${config.iconApi}`.replace(/^http/, 'https')
        config.sysImgApi = `${reg[1]}${config.sysImgApi}`.replace(/^http/, 'https')
      }
      resolve()
    })
  })
}

// 获取用户信息
export const getUserInfo = function (options, callback) {
  axios({
    method: 'get',
    url: config.nukeApi,
    params: {
      lite: 'js',
      noprefix: '',
      ...options
    }
  }).then((res) => {
    parseJson(res.data, function (json) {
      callback && callback(json)
    })
  }).catch((err) => {
    console.log(err)
    callback && callback(err.response.data)
  })
}

// 获取板块列表
export const getRegionList = function (callback) {
  axios.get(config.regionApi).then((res) => {
    parseJson(res.data, function (json) {
      callback && callback(json)
    })
  }).catch((err) => {
    console.log(err)
    callback && callback(err.response.data)
  })
}

// 获取帖子列表
export const getList = function (options, callback) {
  axios.get(config.listApi, {
    params: {
      lite: 'js',
      order_by: 'postdatedesc',
      noprefix: '',
      ...options
    }
  }).then((res) => {
    const json = res.data
    if (typeof json === 'string') {
      parseJson(json, function (json) {
        // 获取图片baseURL
        const { __GLOBAL } = json.data
        updateImgBase(__GLOBAL._ATTACH_BASE_VIEW)

        callback && callback(json)
      })
    } else {
      // 获取图片baseURL
      const { __GLOBAL } = json.data
      updateImgBase(__GLOBAL._ATTACH_BASE_VIEW)

      callback && callback(json)
    }
  }).catch((err) => {
    console.log(err)
    callback && callback(err.response.data)
  })
}

// 关注 && 取消 子版块
export const subSubForums = function (data, params, callback) {
  axios({
    method: 'post',
    url: config.nukeApi,
    headers: {
      'content-type': 'application/x-www-form-urlencoded'
    },
    data: qs.stringify({
      ...params,
      type: 1,
      info: 'add_to_block_tids'
    }),
    params: {
      lite: 'js',
      noprefix: '',
      __lib: 'user_option',
      __act: 'set',
      raw: 3,
      ...data
    }
  }).then((res) => {
    const json = res.data
    if (typeof json === 'string') {
      parseJson(json, function (json) {
        callback && callback(json)
      })
    } else {
      callback && callback(json)
    }
  }).catch((err) => {
    console.log(err)
    callback && callback(err.response.data)
  })
}

// 获取帖子详情
export const getPostDetail = function (options, callback) {
  axios.get(config.detailApi, {
    params: {
      lite: 'js',
      noprefix: '',
      ...options
    }
  }).then((res) => {
    const json = res.data
    if (typeof json === 'string') {
      parseJson(json, function (json) {
        // 获取图片baseURL
        const { __GLOBAL } = json.data
        updateImgBase(__GLOBAL._ATTACH_BASE_VIEW)

        callback && callback(json)
      })
    } else {
      // 获取图片baseURL
      const { __GLOBAL } = json.data
      updateImgBase(__GLOBAL._ATTACH_BASE_VIEW)

      callback && callback(json)
    }
  }).catch((err) => {
    console.log(err)
    callback && callback(err.response.data)
  })
}

const updateImgBase = function (url) {
  config.imgBaseApi = url.match(/^http/) ? `${url}/` : `https://${url}/`
}

// 回帖 - 因为是form表单提交，所以不能拿到响应数据
export const postReply = function (options) {
  const form = document.createElement('form')
  const iframe = document.createElement('iframe')
  const _id = `doHttpRequest${Math.floor(Math.random() * 10000)}`

  form.setAttribute('action', config.replyApi)
  form.setAttribute('method', 'post')
  form.setAttribute('accept-charset', 'GBK')
  form.setAttribute('enctype', 'application/x-www-form-urlencoded')
  form.setAttribute('target', _id)
  iframe.setAttribute('id', _id)
  iframe.setAttribute('name', _id)
  iframe.setAttribute('src', 'about:blank')

  document.body.appendChild(form)
  document.body.appendChild(iframe)

  for (const p in options) {
    const input = document.createElement('input')
    input.type = 'text'
    input.setAttribute('name', p)
    input.setAttribute('value', options[p])
    form.appendChild(input)
  }

  form.submit()

  setTimeout(() => {
    form.remove()
    iframe.remove()
  }, 1000)
}
