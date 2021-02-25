import config from './config'
import * as Forum from './forum'
import * as Utils from './utils'
import queue from 'queue'

export const startCheckImg = function (option, callback) {
  const q = queue()

  if (!option.hasFirstCheck) {
    const max = Math.ceil(option.replies === 0 ? 1 : option.replies / 20)
    for (let i = 1; i <= max; i++) {
      q.push(function () {
        return checkImg(option.tid, i)
      })
    }
    q.start(function () {
      Utils.searchFocus(option.tid, function (arrs) {
        const data = arrs[0]
        data.hasFirstCheck = true
        Utils.saveFocus(option.tid, data)
        callback && callback()
      })
      Utils.tipNewImg()
    })
  } else {
    q.push(function () {
      return checkImg(option.tid, 'e')
    })
    q.start(function () {
      Utils.tipNewImg()
      callback && callback()
    })
  }
}

const checkImg = function (tid, page) {
  return new Promise(function (resolve) {
    Forum.getPostDetail({
      tid: tid,
      page
    }, function (res) {
      const { __R, __MESSAGE } = res.data
      if (__MESSAGE && __MESSAGE[1]) {
        Utils.searchFocus(tid, function (arrs) {
          const data = arrs[0]
          data.error = {
            message: __MESSAGE[1]
          }
          Utils.saveFocus(tid, data, function () {
            resolve()
          })
        })
        return resolve()
      }

      Utils.searchFocus(tid, function (arrs) {
        const data = arrs[0]
        data.checkTimes += 1
        Object.keys(__R).forEach((item) => {
          if (__R[item].attachs) {
            console.log('检测到附件')
            console.log(`帖子id: ${tid} | 回复id: ${__R[item].pid}`)
            const finded = data.imgList.find((val) => val.pid === __R[item].pid)
            if (!finded) {
              data.imgList.push({
                pid: __R[item].pid,
                baseUrl: config.imgBaseApi,
                attachs: Object.keys(__R[item].attachs).map((val) => {
                  return __R[item].attachs[val]
                })
              })
              data.newImgLength += Object.keys(__R[item].attachs).length
            } else {
              const img = Object.keys(__R[item].attachs).map((val) => {
                if (!finded.attachs.find((k) => k.attachurl === __R[item].attachs[val].attachurl)) {
                  return __R[item].attachs[val]
                }
              }).filter(v => v)
              data.newImgLength += img.length
              finded.attachs.concat(img)
            }
          }
        })
        // 保存数据
        Utils.saveFocus(tid, data, function () {
          resolve()
        })
      })
    })
  })
}
