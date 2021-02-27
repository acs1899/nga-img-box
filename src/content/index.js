/* eslint-disable */

$(function () {
  let focusList = []

  // 获取关注列表
  function getAllFocus () {
    console.log('storage change')
    chrome.storage.local.get(null, function (items) {
      const _arr = []
      Object.keys(items).forEach((val) => {
        if (items[val]) {
          _arr.push(items[val])
        }
      })
      focusList = _arr
      updateFocusBtn()
    })
  }

  // 监听关注列表变化
  console.log('监听storage')
  chrome.storage.onChanged.addListener(getAllFocus)

  // 监听DOM变化，添加关注按钮
  function addListenDomChange () {
    const options = {
      childList: true,
      subtree: true
    }
    const TableObserve = new MutationObserver(function () {
      if ($('#topicrows .topicrow').length || $('#m_posts_c').length) {
        addListFocusBtn()
      }
    })

    TableObserve.observe(document, options)
  }

  // 添加关注按钮
  function addListFocusBtn () {
    const threadLits = $('#topicrows')
    const postList = $('#m_posts_c')

    // 列表页
    if (threadLits.length) {
      const trs = threadLits.find('.topicrow').not(':has(.c5)')

      trs.each(function () {
        const $this = $(this)
        const $td = $(document.createElement('td'))
        const button = $(document.createElement('button'))
        const tid = +getQueryString('tid', $this.find('.c1 a')[0].search)
        const subject = $this.find('.c2 a.topic').text()
        const author = $this.find('.c3 a.author').text()
        const postdate = '20' + $this.find('.c3 span.postdate').attr('title')
        const replies = +($this.find('.c1 .replies').text())
        const hasFocus = !!focusList.find(function(item){return item.tid === tid})

        $td.addClass('c5')
        button.css({
          width: '80px',
          cursor: 'pointer'
        })

        button.data('tid', tid)
        button.data('subject', subject)
        button.data('author', author)
        button.data('postdate', postdate)
        button.data('replies', replies)
        button.data('hasFocus', hasFocus)

        if (hasFocus) {
          focusBtnStyle(button, true)
        } else {
          focusBtnStyle(button, false)
        }
        button.on('click', function () {
          const data = $(this).data()
          if (!data.hasFocus) {
            delete data.hasFocus
            chrome.runtime.sendMessage({ type: MSG_TYPE.ADD_FOCUS, data: data }, function () {
              button.data('hasFocus', true)
            })
          } else {
            chrome.runtime.sendMessage({ type: MSG_TYPE.DEL_FOCUS, data: data }, function () {
              button.data('hasFocus', false)
            })
          }
        })

        $td.append(button)
        $this.append($td)
      })
    }

    // 帖子详情页
    if (postList.length) {
      const el = $('#postbtop tr').not(':has(.focus-btn)')
      const tid = +getQueryString('tid', window.location.search)

      el.each(function () {
        const $td = $(document.createElement('td'))
        const $a = $(document.createElement('a'))
        const subject = $('#postsubject0').text()
        const author = $('#postauthor0').text()
        const postdate = $('#postdate0').text()
        const hasFocus = !!focusList.find(function(item){return item.tid === tid})

        $a.addClass('focus-btn')

        $a.attr('href', 'javascript:void(0)')
        $a.data('tid', tid)
        $a.data('subject', subject)
        $a.data('author', author)
        $a.data('postdate', postdate)
        $a.data('hasFocus', hasFocus)

        if (hasFocus) {
          focusBtnStyle($a, true)
        } else {
          focusBtnStyle($a, false)
        }

        $a.on('click', function () {
          const data = $(this).data()
          if (!data.hasFocus) {
            delete data.hasFocus
            chrome.runtime.sendMessage({ type: MSG_TYPE.ADD_FOCUS, data: data }, function () {
              $a.data('hasFocus', true)
            })
          } else {
            chrome.runtime.sendMessage({ type: MSG_TYPE.DEL_FOCUS, data: data }, function () {
              $a.data('hasFocus', false)
            })
          }
        })

        $td.append($a)
        el.prepend($td)

        getPostDetail(tid, function (res) {
          $a.data('replies', res.__ROWS)
        })
      })
    }
  }

  function getPostDetail (tid, callback) {
    $.ajax(window.location.href, {
      data: {
        lite: 'js',
        noprefix: '',
        tid: tid
      },
      success: function (res) {
        console.log(res)
        callback && callback(res.data)
      },
      error: function (res) {
        const json = parseJson(res.responseText)
        callback && callback(json.data)
      }
    })
  }

  // 更新关注按钮状态
  function updateFocusBtn () {
    console.log('更新按钮状态')
    const btns = $('#topicrows .topicrow .c5 button')
    const anchors = $('#m_pbtntop tr .focus-btn')

    if (btns.length) {
      btns.each(function () {
        const $this = $(this)
        const tid = $this.data('tid')

        if (!!focusList.find(function(item){return item.tid === tid})) {
          $this.data('hasFocus', true)
          focusBtnStyle($this, true)
        } else {
          $this.data('hasFocus', false)
          focusBtnStyle($this, false)
        }
      })
    }

    if (anchors.length) {
      anchors.each(function () {
        const $this = $(this)
        const tid = $this.data('tid')

        if (!!focusList.find(function(item){return item.tid === tid})) {
          $this.data('hasFocus', true)
          focusBtnStyle($this, true)
        } else {
          $this.data('hasFocus', false)
          focusBtnStyle($this, false)
        }
      })
    }
  }

  // 关注按钮样式
  function focusBtnStyle ($btn, status) {
    if (status) {
      $btn.text('取消关注')
      $btn.css({
        background: '#591804',
        color: '#fff8e7'
      })
    } else {
      $btn.text('添加关注')
      $btn.css({
        background: '',
        color: ''
      })
    }
  }

  // json字符串解析
  function parseJson (json) {
    let jsonObj = null

    try {
      jsonObj = JSON.parse(json)
    } catch (ex) {
      // new Function的方式，能自动给key补全双引号，但是不支持bigint
      try {
        jsonObj = new Function('return ' + json)()
      } catch (exx) {
        try {
          // 是不是下面这种情况："{\"ret\":\"0\", \"msg\":\"ok\"}"
          jsonObj = new Function("return '" + json + "'")()
          if (typeof jsonObj === 'string') {
            // 是个字符串，再转一次
            jsonObj = new Function('return ' + jsonObj)()
          }
        } catch (exxx) {
          console.log(exxx)
        }
      }
    }

    return jsonObj
  }

  // URL截取参数
  function getQueryString (name, url) {
    const reg = new RegExp(`(^|&)${name}=([^&]*)(&|$)`, 'i')
    const r = url.substr(1).match(reg)
    if (r != null) return unescape(r[2])
    return null
  }

  getAllFocus()
  addListenDomChange()
  // addListenUrlChange()
  // 监听url变化，添加DOM监听
  // function addListenUrlChange () {
  //   let lastUrl = location.href
  //   const locationChange = new MutationObserver(() => {
  //     const url = location.href
  //     if (url !== lastUrl) {
  //       lastUrl = url
  //       onUrlChange()
  //     }
  //   })
  //   function onUrlChange () {
  //     addListenDomChange()
  //   }
  //   locationChange.observe(document, { subtree: true, childList: true })
  // }
})
