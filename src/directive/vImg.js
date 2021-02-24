import Vue from 'vue'

Vue.directive('real-img', async function (el, binding) {
  const imgURL = binding.value
  if (imgURL) {
    const exist = await imageIsExist(imgURL)
    if (exist) {
      el.setAttribute('src', imgURL)
    }
  }
})

/**
 * 检测图片是否存在
 * @param url
 */
const imageIsExist = function (url) {
  return new Promise((resolve) => {
    var img = new Image()
    img.onload = function () {
      if (this.complete === true) {
        resolve(true)
        img = null
      }
    }
    img.onerror = function () {
      resolve(false)
      this.remove()
    }
    img.src = url
  })
}
