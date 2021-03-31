<template>
  <div class="option-app-list">
    <a-page-header
      style="border: 1px solid rgb(235, 237, 240)"
      :title="title"
      @back="goBack"
    >
      <template slot="extra">
        排序：
        <a-select :value="params.order_by" @change="handleSelectOrder">
          <a-select-option value="postdatedesc">
            发帖时间
          </a-select-option>
          <a-select-option value="lastpostdesc">
            回帖时间
          </a-select-option>
        </a-select>
        <a-button @click="refresh">刷新</a-button>
        <a-button type="primary" @click="showSubForums" v-if="subForums.length">子版块</a-button>
      </template>
      <a-card v-show="subForumVisible">
        <a-row>
          <a-col :span="8" v-for="item in subForums" :key="item.id">
            <a-checkbox :disabled="item.hasChecked" :defaultChecked="item.checked" :value="item.tid" @change="onSubChange">
              <router-link :to="`/list?fid=${item.id}&title=${item.title}&ff=${params.fid}`">{{ item.title }}</router-link>
            </a-checkbox>
            <p class="sub-forum-des">{{ item.subTitle }}<br></p>
          </a-col>
        </a-row>
      </a-card>
    </a-page-header>
    <a-list
      class="thread-list"
      item-layout="horizontal"
      :loading="loading"
      :data-source="list"
    >
      <a-list-item slot="renderItem" slot-scope="item">
        <span slot="actions">
          <a-icon type="message" style="margin-right: 8px" />
          {{ item.replies > 999 ? '999+' : item.replies }}
        </span>
        <span slot="actions">
          <a-icon type="star" :theme="item.isFocus ? 'filled': 'outlined'" style="margin-right: 8px" @click="handleFocus(item)" />
        </span>
        <a-list-item-meta :description="item.author" >
          <a slot="title" @click="jumpToDetail(item)">
            <span v-html="item.subject"></span>
            <span class="sub-parent">{{ item.parent ? `[${item.parent[2]}]` : '' }}</span></a>
        </a-list-item-meta>
      </a-list-item>
    </a-list>
    <div class="pagination">
      <a-pagination
        v-model="params.page"
        :total="pageParams.total"
        :defaultPageSize="pageParams.pageSize"
        @change="getList"
      />
    </div>
  </div>
</template>

<script>
import { mapMutations } from 'vuex'
import { transferAnonyName, formatTime } from '@/utils/index'

export default {
  name: 'List',
  data () {
    return {
      bg: chrome.extension.getBackgroundPage().bg,
      loading: false,
      finished: false,
      subForumVisible: false,
      title: this.$route.query.title,
      list: [],
      subForums: [],
      params: {
        fid: this.$route.query.fid || '',
        ff: this.$route.query.ff || '',
        page: 1,
        order_by: 'postdatedesc'
      },
      pageParams: {
        pageSize: 20,
        total: 0
      }
    }
  },
  created () {
    this.getList()
    // 监听storage变化
    chrome.storage.onChanged.addListener(this.checkFocus)
  },
  beforeDestroy () {
    // 清除storage监听
    chrome.storage.onChanged.removeListener(this.checkFocus)
  },
  beforeRouteLeave (to, from, next) {
    if (to.name !== 'Detail') {
      this.noKeepAlive(from.name)
    }
    next()
  },
  methods: {
    ...mapMutations(['noKeepAlive']),
    formatTime,
    showSubForums () {
      this.subForumVisible = !this.subForumVisible
    },
    onSubChange (e) {
      const checked = e.target.checked
      const tid = e.target.value
      const data = checked ? { del: tid } : { add: tid }

      this.bg.subSubForums(data, { fid: this.params.fid }, (res) => {
        if (res.data && res.data[0] === '操作成功 请刷新页面') {
          this.refresh()
        }
      })
    },
    getList () {
      this.loading = true
      const params = {
        ...this.params
      }

      if (params.ff === '') {
        delete params.ff
      }
      this.bg.getList(params, (res) => {
        if (res) {
          this.loading = false
          if (res.data.__MESSAGE && res.data.__MESSAGE[1]) {
            this.$message.warning(res.data.__MESSAGE[1])
          }

          this.subForums = res.data.__F && Object.keys(res.data.__F.sub_forums).map((item) => {
            const f = res.data.__F.sub_forums[item]
            f[4] |= 0

            return {
              id: `${f[0]}`,
              tid: `${f[3]}`,
              title: f[1],
              subTitle: f[2],
              hasChecked: !((f[4] & 2) || (f[4] & 768) === 768 || (f[4] & 1280) === 1280),
              checked: !!(f[4] & 4)
            }
          })

          this.list = Object.keys(res.data.__T).map((item) => {
            res.data.__T[item].isFocus = false
            res.data.__T[item].author = `${res.data.__T[item].author}`.match(/^#anony/) ? transferAnonyName(res.data.__T[item].author)[0] : res.data.__T[item].author
            return res.data.__T[item]
          })
          this.pageParams.pageSize = res.data.__T__ROWS
          this.pageParams.total = res.data.__ROWS

          window.scrollTo(0, 0)

          this.checkFocus()
        }
      })
    },
    checkFocus () {
      this.bg.searchFocus(this.list.map((item) => item.tid), (items) => {
        this.list.forEach((val) => {
          const include = items.find((item) => item.tid === val.tid)
          if (include) {
            val.isFocus = true
          } else {
            val.isFocus = false
          }
        })
      })
    },
    handleFocus (item) {
      if (!item.isFocus) {
        const data = {
          tid: item.tid,
          subject: item.subject,
          author: item.author,
          postdate: this.formatTime(item.postdate),
          replies: item.replies
        }
        this.bg.saveFocus(item.tid, data, () => {
          item.isFocus = true
          this.bg.startCheckImg(item)
        })
      }
    },
    resetList () {
      this.params.page = 1
      this.getList()
    },
    handleSelectOrder (val) {
      this.params.order_by = val
      this.resetList()
    },
    jumpToDetail (item) {
      const a = document.createElement('a')
      a.href = item.tpcurl
      const searchParams = new URLSearchParams(a.search)
      const tid = searchParams.get('tid')
      this.$router.push(`/detail?tid=${tid || item.tid}`)
    },
    refresh () {
      this.resetList()
    },
    goBack () {
      this.$router.back()
    }
  }
}
</script>

<style lang="scss">
.option-app-list {
  .sub-forum-des {
    padding-left: 22px;
    font-size: 12px;
    color: #999;
  }
  .thread-list {
    padding: 15px 20px;
    .sub-parent {
      font-size: 12px;
      color: #999;
    }
  }
  .pagination {
    padding: 20px;
    text-align: center;
  }
}
</style>
