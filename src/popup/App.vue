<template>
  <div id="app">
    <a-list bordered>
      <a-list-item>
        <a-row>
          <a-col :span="8">扫描启用</a-col>
          <a-col class="f-r" :span="8" :offset="8">
            <a-switch :checked="checked" size="small" @change="onChangeOpen" />
          </a-col>
        </a-row>
      </a-list-item>
      <a-list-item>
        <a-row>
          <a-col :span="8">扫描数量</a-col>
          <a-col class="f-r" :span="8" :offset="8">
            {{ checkLength }}
          </a-col>
        </a-row>
      </a-list-item>
      <a-list-item>
        <a-row>
          <a-col :span="8">
            <a @click="jumpToSetting">
              <a-icon theme="filled" type="setting" />
              设置
            </a>
          </a-col>
          <a-col class="f-r" :span="8" :offset="8">
            <a @click="jumpToFeadback">
              <a-icon theme="filled" type="message" />
              反馈
            </a>
          </a-col>
        </a-row>
      </a-list-item>
    </a-list>
  </div>
</template>

<script>
export default {
  data () {
    const bg = chrome.extension.getBackgroundPage().bg

    return {
      bg,
      checked: !!bg.config.intervalOpen,
      checkLength: 0
    }
  },
  created () {
    this.bg.getAllFocus((items) => {
      this.checkLength = items.length
    })
  },
  methods: {
    onChangeOpen (val) {
      if (!val) {
        this.bg.cancelCheckFocus()
      } else {
        this.bg.openCheckFocus()
      }
      this.checked = val
    },
    jumpToSetting (e) {
      e.preventDefault()
      chrome.runtime.openOptionsPage()
      window.close()
    },
    jumpToFeadback (e) {
      e.preventDefault()
      window.open('https://blog.acs1899.com/lab/nga-img-box#vcomment')
      window.close()
    }
  }
}
</script>

<style lang="scss" scoped>
#app {
  width: 200px;
  font-size: 12px;
  .ant-list-item {
    padding: 10px 8px;
    .ant-row {
      width: 100%;
    }
    .f-r {
      text-align: right;
    }
  }
}
</style>
