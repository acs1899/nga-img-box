<template>
  <div class="option-app-setting">
    <!-- 登录 -->
    <h2>登录</h2>
    <a-page-header
      style="border: 1px solid rgb(235, 237, 240);margin-bottom: 20px;"
      :sub-title="!uid ? '使用前请先关联账号（登陆接口使用官方通道请放心使用）' : '账户'"
      :backIcon="false"
    >
      <template slot="extra">
        <a-button type="primary" v-if="!uid" @click="handleLogin">登陆</a-button>
      </template>
      <a-descriptions size="small" :column="4" v-if="userInfo">
        <a-descriptions-item label="用户ID">
          {{ userInfo.uid }}
        </a-descriptions-item>
        <a-descriptions-item label="用户名">
          {{ userInfo.username }}
        </a-descriptions-item>
        <a-descriptions-item label="邮箱">
          {{ userInfo.email }}
        </a-descriptions-item>
        <a-descriptions-item label="用户组">
          {{ userInfo.group }}
        </a-descriptions-item>
        <a-descriptions-item label="发帖数">
          {{ userInfo.posts }}
        </a-descriptions-item>
        <a-descriptions-item label="金钱">
          <div v-html="calcMoney(userInfo.money)"></div>
        </a-descriptions-item>
        <a-descriptions-item label="注册日期">
          {{ userInfo.regdate }}
        </a-descriptions-item>
      </a-descriptions>
    </a-page-header>

    <h2>关于</h2>
    <a-page-header
      style="border: 1px solid rgb(235, 237, 240)"
      :backIcon="false"
    >
      <p>本插件适用于监控论坛内指定关注的帖子，收集回帖内的图片。</p>
      <a-button type="primary" @click="checkRelease">手动检查更新</a-button>
      <a v-show="hasNewVersion" style="margin-left:10px;vertical-align: bottom;" href="http://ngaimgbox.appchizi.com/public/index.html" target="_blank">发现新版本，去下载</a>
      <span class="tip">不能通过应用商店更新时，可以尝试手动下载</span>
    </a-page-header>
    <!-- 登录 -->
    <a-modal
      title="账号登录"
      :visible="isShowLoginDialog"
      :footer="null"
      :destroyOnClose="true"
      :maskClosable="false"
      @cancel="handleCancelLogin"
    >
      <iframe :src="`${bg.config.nukeApi}?__lib=login&__act=account&login`" style="border: none; width: 100%; height: 50em;"></iframe>
    </a-modal>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'Setting',
  data () {
    return {
      bg: chrome.extension.getBackgroundPage().bg,
      uid: chrome.extension.getBackgroundPage().bg.config.ngaUid || '',
      manifest: chrome.runtime.getManifest(),
      hasNewVersion: false,
      userInfo: null,
      isShowLoginDialog: false
    }
  },
  async created () {
    await this.bg.checkCookie()
    this.uid = this.bg.config.ngaUid
    if (this.uid) {
      this.getUserInfo()
    } else {
      window.addEventListener('message', (e) => {
        console.log(e)
      })
    }
  },
  methods: {
    getUserInfo () {
      this.bg.getUserInfo({
        __lib: 'ucp',
        __act: 'get',
        uid: this.uid
      }, (res) => {
        this.userInfo = res.data[0]
        console.log(this.userInfo)
      })
    },
    handleLogin () {
      this.isShowLoginDialog = true
    },
    handleCancelLogin () {
      this.isShowLoginDialog = false
    },
    calcMoney (c) {
      const imgBase = this.bg.config.sysImgApi
      c = parseInt(c, 10)
      if (!c || c <= 0) {
        return ''
      }
      const g = Math.floor(c / 10000)
      const s = Math.floor(c / 100) - g * 100
      let h = ''
      let t = ''
      c = c - g * 10000 - s * 100
      if (g) {
        t += `${g}金币 `
        h += `${g}<img alt='金币' style='margin:2px 1px -2px 0px' src='${imgBase}/g.gif'/>`
      }
      if (s) {
        t += `${s}银币 `
        if (g < 100) {
          h += `${s}<img alt='银币' style='margin:2px 1px -2px 0px' src='${imgBase}/s.gif'>`
        }
      }
      if (c) {
        t += `${c}铜币 `
        if (!g) {
          h += `${c}<img alt='铜币' style='margin:2px 1px -2px 0px' src='${imgBase}/c.gif'/>`
        }
      }
      return `<span title='${t}'>${h}</span>`
    },
    checkRelease () {
      axios.get('https://api.github.com/repos/acs1899/nga-img-box/releases').then((res) => {
        const { data } = res
        if (data.length && data[0].tag_name !== `v${this.manifest.version}`) {
          this.hasNewVersion = true
        } else {
          this.$message.success('当前为最新版本')
        }
      })
    }
  }
}
</script>

<style lang="scss">
.option-app-setting {
  .tip {
    margin-left: 10px;
    vertical-align: bottom;
    color: #999;
    font-size: 12px;
  }
}
</style>
