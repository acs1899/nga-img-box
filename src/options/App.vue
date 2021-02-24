<template>
  <div id="app">
    <a-tabs :activeKey="currentPath" @change="go">
      <a-tab-pane key="region" tab="浏览">
        <!--<transition name="left-transform" mode="out-in">-->
          <keep-alive :include="keepAliveComponents">
            <router-view v-if="bg.config.ngaUid" />
          </keep-alive>
        <!--</transition>-->
      </a-tab-pane>
      <a-tab-pane key="focus" tab="关注列表">
        <focus />
      </a-tab-pane>
      <a-tab-pane key="setting" tab="设置">
        <setting />
      </a-tab-pane>
    </a-tabs>
    <!--<transition name="right-transform" mode="out-in">-->
      <!--<router-view v-if="!$route.meta.alive" />-->
    <!--</transition>-->
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
      bg: chrome.extension.getBackgroundPage().bg
    }
  },
  created () {
    this.bg.checkCookie()
  },
  computed: {
    ...mapState({
      keepAliveComponents: state => state.keepAliveComponents,
      currentPath: state => state.currentPath
    })
  },
  methods: {
    ...mapMutations(['setPath']),
    go (path) {
      this.setPath(path)
    }
  }
}
</script>

<style lang="scss" scoped>
#app {
  padding: 20px;

  /*left transition*/
  .left-enter-active,
  .left-leave-active {
    transition: opacity 0.3s;
  }

  .left-enter,
  .left-leave-active {
    opacity: 0;
  }

  .left-transform-leave-active,
  .left-transform-enter-active {
    transition: all .5s;
  }
  .left-transform-enter {
    opacity: 0;
    transform: translateX(-30px);
  }
  .left-transform-leave-to {
    opacity: 0;
    transform: translateX(-30px);
  }

  /*right transition*/
  .right-enter-active,
  .right-leave-active {
    transition: opacity 0.3s;
  }

  .right-enter,
  .right-leave-active {
    opacity: 0;
  }

  .right-transform-leave-active,
  .right-transform-enter-active {
    transition: all .5s;
  }
  .right-transform-enter {
    opacity: 0;
    transform: translateX(30px);
  }
  .right-transform-leave-to {
    opacity: 0;
    transform: translateX(30px);
  }
}
</style>
