<template>
  <div id="app">
    <a-tabs :activeKey="currentPath" @change="go">
      <a-tab-pane key="region" tab="浏览">
        <keep-alive :include="keepAliveComponents">
          <router-view v-if="bg.config.ngaUid" :key="$route.fullPath" />
          <a-empty v-else>
            <span slot="description"> 请先关联账号 </span>
            <a-button type="primary" @click="go('setting')">去关联</a-button>
          </a-empty>
        </keep-alive>
      </a-tab-pane>
      <a-tab-pane key="focus">
        <a-badge :count="newImg" slot="tab">关注列表</a-badge>
        <focus />
      </a-tab-pane>
      <a-tab-pane key="setting" tab="设置">
        <setting />
      </a-tab-pane>
      <span class="version" slot="tabBarExtraContent">
        <b>当前版本</b>
        <i>v{{manifest.version}}</i>
      </span>
    </a-tabs>
  </div>
</template>

<script>
import { mapState, mapMutations } from 'vuex'
import Setting from './views/Setting.vue'
import Focus from './views/Focus.vue'

export default {
  components: {
    Setting,
    Focus
  },
  data () {
    return {
      bg: chrome.extension.getBackgroundPage().bg,
      manifest: chrome.runtime.getManifest(),
      newImg: 0
    }
  },
  created () {
    this.bg.checkCookie()
    this.getNewImg()
    // 监听storage变化
    chrome.storage.onChanged.addListener(this.getNewImg)
  },
  beforeDestroy () {
    // 清除storage监听
    chrome.storage.onChanged.removeListener(this.getNewImg)
  },
  computed: {
    ...mapState({
      keepAliveComponents: state => state.keepAliveComponents,
      currentPath: state => state.currentPath
    })
  },
  methods: {
    ...mapMutations(['setPath']),
    getNewImg () {
      this.bg.getAllFocus((arr) => {
        const newObj = arr.reduce((acc, curr) => {
          return {
            newImgLength: acc.newImgLength + curr.newImgLength
          }
        }, { newImgLength: 0 })

        // 收集到新图片时，在tab上提示
        if (newObj.newImgLength > 0) {
          this.newImg = newObj.newImgLength
        } else {
          this.newImg = 0
        }
      })
    },
    go (path) {
      this.setPath(path)
    }
  }
}
</script>

<style lang="scss">
#app {
  padding: 20px;
  .version {
    b, i {
      background: #5b5b5b;
      padding: 3px 5px;
      border-radius: 3px 0 0 3px;
      color: #fff;
      font-weight: lighter;
      font-style: normal;
      font-family: monospace;
    }
    i {
      border-radius: 0 3px 3px 0;
      background: #0e7fbf;
    }
  }
}
</style>
