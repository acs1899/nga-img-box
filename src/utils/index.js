import { FACE_MAP } from '../constant/index'

const bg = chrome.extension.getBackgroundPage().bg
const faceBaseUrl = bg.config.faceApi

// 时间格式处理
export const formatTime = function (time, cFormat) {
  if (arguments.length === 0) {
    return null
  }
  const format = cFormat || '{y}-{m}-{d} {h}:{i}:{s}'
  let date
  if (typeof time === 'object') {
    date = time
  } else {
    if ((`${time}`).length === 10) { time = parseInt(time, 10) * 1000 }
    date = new Date(time)
  }
  const formatObj = {
    y: date.getFullYear(),
    m: date.getMonth() + 1,
    d: date.getDate(),
    h: date.getHours(),
    i: date.getMinutes(),
    s: date.getSeconds(),
    a: date.getDay()
  }
  return format.replace(/{(y|m|d|h|i|s|a)+}/g, (result, key) => {
    let value = formatObj[key]
    if (key === 'a') {
      return ['日', '一', '二', '三', '四', '五', '六'][value]
    }
    if (result.length > 0 && value < 10) {
      value = `0${value}`
    }
    return value || 0
  })
}

// 处理表情
export const transferFacebread = function (str) {
  return str.replace(/\[s:(.{1,10}?)\]/gi, function ($0, $1) {
    let x = ''
    let y = ''
    let z = ''
    if (parseInt($1, 10)) {
      x = faceBaseUrl + '/post/smile/' + FACE_MAP[0][$1]
      y = 'S' + $1
      z = ''
    } else {
      $1 = $1.split(':')
      x = FACE_MAP[$1[0]]
      if (!x) {
        return $0
      }
      if (!$1[1] || !x[$1[1]]) {
        return $0
      }
      x = faceBaseUrl + '/post/smile/' + x[$1[1]]
      y = $1[1]
      z = '_' + $1[0]
    }
    return "<img class='facebread smile" + z + "' src='" + x + "' alt='" + y + "'/>"
  })
}

// 处理img
export const transferImg = function (str) {
  function _imgGen (opt, src) {
    if (src && src.match(/^\.\//)) {
      src = src.replace(/^\.(\d+)?\//, function () {
        return bg.config.imgBaseApi
      })
    }
    return `<img class="content-img default-img" src="${src}" />`
  }
  return str.replace(/\[img(-?\d{0,3})\](.+?)\[\/img\]/gi, function ($0, $1, $2) {
    return _imgGen($1, $2)
  })
}

// 处理引用
export const transferQuote = function (str) {
  let p = str.indexOf('[quote') + 1
  if (p) {
    str = str.replace(/(?:<br \/>)?\s*(\[\/?quote\])\s*(?:<br \/>)?/gi, '$1')
  }

  while (p) {
    str = _exe(str, false)
  }

  function _exe (txt, k) {
    p = k
    return txt.replace(/\[quote\]([^\x00]+?)\[\/quote\]/gi, function ($0, $1) { //  多行匹配
      if ($1.match(/\[quote\]/i)) {
        return '[quote]' + _exe($1 + '[/quote]', true)
      }
      if ($1.match(/^\s*\[(?:tid|pid)=[\d,]+\](?:Reply|Topic)\[\/(?:pid|tid)\] (?:\[b\])?Post by/)) {
        return "<div class='quote' " + '>\n' +
          $1.replace(/^\s*\[(?:tid|pid)=[\d,]+\](?:Reply|Topic)\[\/(?:pid|tid)\] \[b\]Post by.+?<br \/><br \/>(\[b\]Reply to .+?\[\/uid\] \(\d+-\d+-\d+ \d+:\d+\):?(\[\/b\])?)/, function ($0, $1) {
            return $0.substr(0, $0.length - $1.length) + "<span style='padding-left:2em' class='subtxt_color'>" + $1 + '</span>'
          }).replace(/\[img(-?\d{0,3})\]/g, '[img0]').replace(/\[iframe(?:=\d+(?:,\d+)?)?\](https?:\/\/)(.+?)\[\/iframe\]/g, function ($0, $1, $2) {
            return '[url]' + $1 + $2 + '[/url]'
          }) + '\n</div>' //  自动截取引用可能产半个bbscode 添加换行分段
      } else {
        return "<div class='quote'>" + $1 + '</div>'
      }
    })
  }
  return str
}

// 处理回复
export const transferReply = function (str) {
  str = str.replace(/\[(tid|pid|stid)=?([\d,]{0,50})\](.+?)\[\/\1\]/gi, function ($0, $1, $2, $3) {
    if ($3 === 'Reply') {
      return '回复'
    }
  })
  return str.replace(/\[b\](.+?)\[\/b\]/gi, function ($0, $1) {
    return $1
  })
}

// 处理用户标签
export const transferUser = function (str) {
  return str.replace(/\[uid=?(\d{0,50})\](.+?)\[\/uid\]/gi, function ($0, $1, $2) {
    return `<strong>${$2}</strong>`
  })
}

// 处理时间
export const transferTime = function (str) {
  return str.replace(/(\(\d+-\d+-\d+ \d+:\d+\))/gi, function ($0) {
    return `<span class="time">${$0}</span>`
  })
}

// 处理匿名
export const transferAnonyName = function (name) {
  name = `${name}`
  if (name.charAt(0) === '#' && name.match(/^#anony_[a-f0-9]{32}$/)) {
    const t1 = '甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥'
    const t2 = '王李张刘陈杨黄吴赵周徐孙马朱胡林郭何高罗郑梁谢宋唐许邓冯韩曹曾彭萧蔡潘田董袁于余叶蒋杜苏魏程吕丁沈任姚卢傅钟姜崔谭廖范汪陆金石戴贾韦夏邱方侯邹熊孟秦白江阎薛尹段雷黎史龙陶贺顾毛郝龚邵万钱严赖覃洪武莫孔汤向常温康施文牛樊葛邢安齐易乔伍庞颜倪庄聂章鲁岳翟殷詹申欧耿关兰焦俞左柳甘祝包宁尚符舒阮柯纪梅童凌毕单季裴霍涂成苗谷盛曲翁冉骆蓝路游辛靳管柴蒙鲍华喻祁蒲房滕屈饶解牟艾尤阳时穆农司卓古吉缪简车项连芦麦褚娄窦戚岑景党宫费卜冷晏席卫米柏宗瞿桂全佟应臧闵苟邬边卞姬师和仇栾隋商刁沙荣巫寇桑郎甄丛仲虞敖巩明佘池查麻苑迟邝'
    let i = 6
    const n = ['']
    for (var j = 0; j < 6; j++) {
      if (j === 0 || j === 3) {
        n[0] += t1.charAt(('0x0' + name.substr(i + 1, 1)) - 0)
      } else if (j < 6) {
        n[0] += t2.charAt(('0x' + name.substr(i, 2)) - 0)
      }
      i += 2
    }
    n[1] = name.substr(i, 6)
    i += 6
    n[2] = name.substr(i, 6)
    return n
  }
  return [name]
}

// 处理折叠
export const transferCollapse = function (str) {
  return str.replace(/\[collapse(=[^\]]{1,50})?\](.+?)\[\/collapse\]/gi, function ($0, $1, $2) {
    const btnTxt = $1 ? $1.substr(1) + ' ...' : '点击显示隐藏的内容 ...'
    return `
      <a-button class="collapse_btn">${btnTxt}</a-button>
      <div class='collapse_block'>${$2}</div>`
  })
}

// 处理删除
export const transferDel = function (str) {
  return str.replace(/\[del\](.+?)\[\/del\]/gi, function ($0, $1) {
    return `<span class="del">${$1}</span>`
  })
}

// 处理链接
export const transferLink = function (str) {
  return str.replace(/\[url(=[^\]]+?)?\](.+?)\[\/url\]/gi, function ($0, $1, $2) {
    if ($1) {
      return `<a target="_blank" href="${$1.substr(1)}" class="link">${$2}</a>`
    } else {
      return `<a target="_blank" href="${$2}" class="link">${$2}</a>`
    }
  })
}

// 处理文本格式
export const transferTxtFormat = function (str) {
  const b = {}
  let off
  const errorHint = function (t) {
    return "<span class='small_colored_text_btn stxt' style='position:absolute;margin:" + Math.random() + 'em 0 0 ' + Math.random() + "em;color:white;background:red'>/*bbscode " + t + ' not match*/</span>'
  }
  const rr = function ($0, e, t, opt, of) {
    if (t === undefined) {
      if ($0.match(/\n+/)) {
        var n = ''
        for (var k in b) {
          while (b[k] > 0) {
            n += '</span>'
            b[k]--
          }
        }
        return n + '\n'
      }
      return $0
    }
    t = t.toLowerCase()
    if (!b[t]) { b[t] = 0 }
    if (e) {
      if (b[t] > 0) {
        b[t]--
      } else {
        return errorHint(t)
      }
    } else {
      b[t]++
    }
    if (t === 'del') {
      return e ? ' </span>' : "<span style='text-decoration:line-through' class='gray'> "
    } else if (t === 'u') {
      return e ? '</span>' : "<span style='text-decoration:underline'>"
    } else if (t === 'b') {
      return e ? '</span>' : "<span style='font-weight:bold'>"
    } else if (t === 'i' || t === 'sup' || t === 'sub') {
      if (e) {
        if (of - off[t] > 55) {
          return '</span>/* bbscode ' + t + ' too long */'
        }
        if (t === 'i') {
          return "</span><img style='display:none' src='about:blank'/>"
        } else if (t === 'sub') {
          return "</span><img style='display:none' src='about:blank'/>"
        } else if (t === 'sup') {
          return "</span><img style='display:none' src='about:blank'/>"
        }
      } else {
        off[t] = of
        return '<span>'
      }
    } else if (t === 'color') {
      if (e) {
        return '</span>'
      }
      let c
      if (opt && (c = opt.match(/^(bg)?(skyblue|royalblue|blue|darkblue|orange|orangered|crimson|red|firebrick|darkred|green|limegreen|seagreen|teal|deeppink|tomato|coral|purple|indigo|burlywood|sandybrown|sienna|chocolate|silver|gray)\s*$/i))) {
        if (c[1]) {
          return "<span class='small_colored_text_btn block_txt_c0' style='font-family:inherit;background-color:" + c[2] + "'>"
        } else {
          return "<span class='" + c[2] + "'>"
        }
      } else {
        return '<span>/* bbscode color error */'
      }
    } else if (t === 'font') {
      if (e) {
        return '</span>'
      }
      const c = opt.match(/^(simsun|simhei|Arial|Arial Black|Book Antiqua|Century Gothic|Comic Sans MS|Courier New|Georgia|Impact|Tahoma|Times New Roman|Trebuchet MS|Script MT Bold|Stencil|Verdana|Lucida Console)\s*$/i)
      if (c) {
        return "<span style='font-family:" + c[1] + "'>"
      } else {
        return '<span>/* bbscode font error */'
      }
    } else if (t === 'size') {
      if (e) {
        return '</span>'
      }
      const c = opt.match(/^(\d{1,3})%?\s*$/i)
      if (c) {
        return "<span style='font-size:" + (c[1] | 0) + "%;line-height:183%'>"
      } else {
        return '<span>/* bbscode size error */'
      }
    } else if (t === 'l' || t === 'r') {
      if (e) {
        return '</span>'
      }
      return "<span style='display:block;' class='" + (t === 'l' ? 'left' : 'right') + "'>"
    } else if (t === 'align') {
      if (e) {
        return '</span>'
      }
      var c = opt.match(/^(left|right|center)\s*$/i)
      if (c) {
        return "<span class='" + (c[1] === 'center' ? 'tac' : (c[1] === 'right' ? 'tar' : '')) + "' style='display:block;text-align:" + c[1] + "'>"
      } else {
        return '<span>/* bbscode align error */'
      }
    } else if (t === 'upup') {
      if (e) {
        return '</span>'
      }
      return "<img src='about:blank' style='display:none'/><span style='font-weight:bold'>"
    } else if (t === 'span') {
      if (e) {
        return '</span>'
      } else {
        if (opt === 'aligntable') {
          return "<img style='display:none' src='about:blank'/><span style='display:none'>"
        } else {
          return '<span>/* bbscode ' + t + ' need option */'
        }
      }
    }
  }

  return str.replace(/(\s*(?:<br \/>)?\s*)(?:\[(\/?)(b|color|size|align|del|font|u|i|sub|sup|span|upup|l|r)(?:[=\s]+([^\]]+))?\])(\s*(?:<br \/>)\s*)?|\n+/gi, function ($0, brs, e, t, opt, bre, of) {
    if (!brs || t === 'l' || t === 'r') {
      brs = ''
    }
    if (!bre || t === 'l' || t === 'r') {
      bre = ''
    }
    if (!opt) {
      opt = ''
    }
    return brs + rr($0, e, t, opt, of) + bre
  })
}

export const filterContent = function (str = '') {
  str = transferTxtFormat(str)
  str = transferDel(str)
  str = transferLink(str)
  str = transferImg(str)
  str = transferFacebread(str)
  str = transferQuote(str)
  str = transferReply(str)
  str = transferUser(str)
  str = transferTime(str)
  str = transferCollapse(str)
  return str
}
