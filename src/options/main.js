import Vue from 'vue'
import router from './router'
import store from './store'
import App from './App.vue'
import Antd from 'ant-design-vue'
import '@/directive/vImg'
import 'ant-design-vue/dist/antd.css'

Vue.use(Antd)

window.Vue = Vue

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  render: h => h(App)
})
