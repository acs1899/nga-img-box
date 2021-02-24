import Vue from 'vue'
import Vuex from 'vuex'
import createPersistedState from 'vuex-persistedstate'

Vue.use(Vuex)

const STORE_KEY = 'nga-image-monitor'
const store = new Vuex.Store({
  state: {
    keepAliveComponents: [],
    currentPath: 'focus'
  },
  mutations: {
    keepAlive (state, component) {
      !state.keepAliveComponents.includes(component) && state.keepAliveComponents.push(component)
    },
    noKeepAlive (state, component) {
      const index = state.keepAliveComponents.indexOf(component)
      index !== -1 && state.keepAliveComponents.splice(index, 1)
    },
    setPath (state, path) {
      state.currentPath = path
    }
  },
  plugins: [
    createPersistedState({
      key: STORE_KEY
    })
  ]
})

export default store
