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
          // 检测附件
          if (__R[item].attachs) {
            const finded = data.imgList.find((val) => val.pid === __R[item].pid)

            if (!finded) {
              const attachs = Object.keys(__R[item].attachs).map((val) => {
                const isImg = __R[item].attachs[val].type === 'img'
                return isImg ? __R[item].attachs[val] : undefined
              }).filter(v => v)

              data.imgList.push({
                pid: __R[item].pid,
                baseUrl: config.imgBaseApi,
                attachs
              })
              data.newImgLength += attachs.length

              if (attachs.length) {
                console.log(`检测到附件: 帖子id: ${tid} | 回复id: ${__R[item].pid} | 新增`)
                console.table(attachs.map(p => `${config.imgBaseApi}${p.attachurl}`))
              }
            } else {
              const img = Object.keys(__R[item].attachs).map((val) => {
                if (!finded.attachs.find((k) => k.attachurl === __R[item].attachs[val].attachurl)) {
                  return __R[item].attachs[val]
                }
              }).filter(v => v)
              data.newImgLength += img.length
              finded.attachs = finded.attachs.concat(img)

              if (img.length) {
                console.log(`检测到附件: 帖子id: ${tid} | 回复id: ${__R[item].pid} | 更新`)
                console.table(img.map(p => `${p.attachurl}`))
              }
            }
          }

          // 当内容包含引用时 - 检测引用内容图片
          let quote = ''
          __R[item].content.replace(/\[quote\]([^\x00]+?)\[\/quote\]/gi, function ($0, $1) {
            quote = $1
          })
          if (quote) {
            const imgs = []
            quote.replace(/\[img(-?\d{0,3})\](.+?)\[\/img\]/gi, function ($0, $1, $2) {
              imgs.push($2)
            })
            if (imgs.length) {
              const finded = data.imgList.find((val) => val.pid === __R[item].pid)
              const attachs = imgs.map((val) => {
                let name = ''
                let ext = ''
                val.replace(/\/([^/]+)\.([^.]+)$/g, function ($0, $1, $2) {
                  name = $1
                  ext = $2
                })
                return {
                  type: 'img',
                  attachurl: val.replace(/^\.\//, ''),
                  name,
                  ext
                }
              })

              if (!finded) {
                data.imgList.push({
                  pid: __R[item].pid,
                  baseUrl: config.imgBaseApi,
                  attachs
                })

                data.newImgLength += attachs.length

                if (attachs.length) {
                  console.log(`检测到内容图片: 帖子id: ${tid} | 回复id: ${__R[item].pid} | 新增`)
                  console.table(attachs.map(p => `${p.attachurl}`))
                }
              } else {
                const img = attachs.map((val) => {
                  if (!finded.attachs.find((k) => k.attachurl === val.attachurl)) {
                    return val
                  }
                }).filter(v => v)
                data.newImgLength += img.length
                finded.attachs = finded.attachs.concat(img)

                if (img.length) {
                  console.log(`检测到内容图片: 帖子id: ${tid} | 回复id: ${__R[item].pid} | 更新`)
                  console.table(img.map(p => `${p.attachurl}`))
                }
              }
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
