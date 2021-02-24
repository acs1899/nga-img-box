import Vue from 'vue'
import VueRouter from 'vue-router'
import store from './store'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    redirect: '/region'
  },
  {
    path: '/region',
    name: 'Region',
    component: () => import(/* webpackChunkName: "Region" */ './views/Region.vue'),
    meta: {
      alive: true
    }
  },
  {
    path: '/list',
    name: 'List',
    component: () => import(/* webpackChunkName: "List" */ './views/List.vue'),
    meta: {
      alive: true
    }
  },
  {
    path: '/detail',
    name: 'Detail',
    component: () => import(/* webpackChunkName: "Detail" */ './views/Detail.vue'),
    meta: {
      alive: false
    }
  },
  {
    path: '/setting',
    name: 'Setting',
    component: () => import(/* webpackChunkName: "Setting" */ './views/Setting.vue'),
    meta: {
      alive: false
    }
  }
]

const router = new VueRouter({
  routes
})

router.beforeEach((to, from, next) => {
  if (to.meta.alive) {
    store.commit('keepAlive', to.name)
  }
  next()
})

export default router
