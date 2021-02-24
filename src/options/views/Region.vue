<template>
  <div class="option-app-region">
    <a-spin :spinning="loading">
      <a-list class="list" :grid="{ gutter: 16, column: 1 }" :data-source="regionList" :loading="loading">
        <a-list-item slot="renderItem" slot-scope="item">
          <a-card :title="item.name" :bordered="false">
            <div v-for="(value, index) in item.content" :key="index">
              <template v-if="value.content.length">
                <h4>{{ value.name }}</h4>
                <a-list class="list" :grid="{ gutter: 16, column: 4 }" :data-source="value.content">
                  <a-list-item slot="renderItem" slot-scope="val">
                    <a-card>
                      <div slot="title">
                        <router-link :to="`/list?fid=${val.fid}&title=${val.name}`">
                          <img src="@/assets/img/default_icon.png" v-real-img="`${iconApi}/${val.fid}u.png`" />
                          {{ val.name }}
                        </router-link>
                      </div>
                    </a-card>
                  </a-list-item>
                </a-list>
              </template>
            </div>
          </a-card>
        </a-list-item>
      </a-list>
    </a-spin>
  </div>
</template>

<script>

export default {
  name: 'Region',
  data () {
    return {
      bg: chrome.extension.getBackgroundPage().bg,
      loading: true,
      regionData: null
    }
  },
  computed: {
    regionList () {
      let arr = []
      if (this.regionData) {
        arr = Object.keys(this.regionData.single[0]).map((k) => {
          const item = this.regionData.all[this.regionData.single[0][k]]
          if (this.regionData.single[0][k] !== 'fast') {
            return {
              fid: item.id,
              name: item.name,
              content: item.content
            }
          }
        })
      }
      console.log(arr)
      return arr.filter(v => v).filter(v => v.name)
    },
    iconApi () {
      return this.bg.config.iconApi
    }
  },
  created () {
    this.getRegion()
  },
  methods: {
    getRegion () {
      this.loading = true
      this.bg.getRegionList((data) => {
        this.regionData = data.data[0]
        Object.keys(this.regionData.all).map((k) => {
          this.regionData.all[k].content = this.toContentArray(this.regionData.all[k].content)
        })
        this.loading = false
      })
    },
    toContentArray (obj) {
      const arr = []
      Object.keys(obj).forEach((k) => {
        if (obj[k].content) {
          obj[k].content = this.toContentArray(obj[k].content)
        }
        arr.push(obj[k])
      })
      return arr
    }
  }
}
</script>

<style lang="scss">
.option-app-region {
  .list {
    width: 100%;
    min-height: 200px;
    .ant-spin {
      display: none;
    }
  }
}
</style>
