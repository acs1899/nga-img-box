<template>
  <div class="option-app-detail">
    <a-affix :offset-top="0">
      <a-page-header
        class="header"
        @back="goBack"
      >
        <div slot="title" v-html="subject"></div>
        <template slot="extra">
          <a-button type="primary" @click="jumpToOrigin">原贴链接<a-icon type="link" /></a-button>
          <a-button v-if="!isFocus" @click="focus">关注</a-button>
          <a-button v-if="isFocus" :disabled="true">已关注</a-button>
          <a-button @click="triggerReply" v-if="isShowReplyBtn">回复</a-button>
        </template>
        <a-form-model
          action="https://bbs.nga.cn/post.php"
          accept-charset="GBK"
          ref="ruleForm"
          v-show="isShowReply"
          :model="form"
          :rules="rules"
          @submit="handleSubmit">
          <a-form-model-item label="" prop="post_content">
            <a-input v-model="form.post_content" type="textarea" />
          </a-form-model-item>
          <a-form-model-item>
            <a-button type="primary" html-type="submit">提交</a-button>
          </a-form-model-item>
        </a-form-model>
      </a-page-header>
    </a-affix>

    <a-list class="post-list" item-layout="vertical" :data-source="list" :loading="loading">
      <a-list-item slot="renderItem" key="item.pid" slot-scope="item">
        <a-comment :author="userInfo[item.authorid] ? transferAnonyName(userInfo[item.authorid].username)[0] : `UID:${item.authorid}`">
          <a-avatar slot="avatar" :src="getAvatar(userInfo[item.authorid].avatar) || defaultAvatar" />
          <template slot="actions">
            <span class="de-action">
              <a-icon type="like-o" style="margin-right: 8px" />
              {{ item.score }}
            </span>
            <span class="de-action">
              <a-icon type="dislike" style="margin-right: 8px" />
              {{ item.score_2 }}
            </span>
          </template>
          <a-tooltip slot="datetime" :title="item.postdate">
            <template v-if="item.authorid === authorId">
              <span><strong>楼主</strong></span>
            </template>
            <template v-else>
              <span>{{ `#${item.lou}` }}</span>
            </template>
          </a-tooltip>
          <div slot="content">
            <!-- 回帖内容 -->
            <template v-if="item.content">
              <HtmlContent :html="filterContent(`${item.content}`)" />
            </template>
            <template v-if="!item.comment && item.comment_to_id">
              {{ item.subject }}
            </template>
          </div>
          <!-- 附件 -->
          <template v-if="item.attachs">
            <a-divider  orientation="left">附件</a-divider>
            <div class="attach-list">
              <a-tag class="attach-item" v-for="val in item.attachs" :key="val.attachurl">
                <div v-if="val.type === 'img'" style="height: 100%" @click="showAttachImg">
                  <span>点击显示附件</span>
                  <img class="attach-img" style="display: none" :src="bg.config.imgBaseApi + val.attachurl" @click.stop="handleClickAttach(val)" />
                </div>
                <div v-else @click="handleClickAttach(val)">
                  {{ val.name }}
                </div>
              </a-tag>
            </div>
          </template>
          <!-- 贴条 -->
          <template v-if="item.comment">
            <a-divider  orientation="left">评论</a-divider>
            <a-comment
              class="comment"
              v-for="val in item.comment"
              :key="val.pid"
              :author="userInfo[val.authorid] ? transferAnonyName(userInfo[val.authorid].username)[0] : `UID:${val.authorid}`"
            >
              <a-avatar slot="avatar" :src="getAvatar(userInfo[val.authorid].avatar) || defaultAvatar" />
              <div slot="content">
                <template v-if="val.content">
                  <HtmlContent :html="transferComment(`${val.content}`)" />
                </template>
              </div>
            </a-comment>
          </template>
        </a-comment>
      </a-list-item>
    </a-list>
    <div class="pagination">
      <a-pagination
        v-model="pageParams.page"
        :total="pageParams.total"
        :defaultPageSize="pageParams.pageSize"
        @change="handleChangePage"
      />
    </div>
  </div>
</template>

<script>
import { filterContent, transferAnonyName, transferComment } from '@/utils/index'
import Viewer from 'viewerjs'
import 'viewerjs/dist/viewer.css'
import HtmlContent from '@/components/HtmlContent.vue'
import defaultAvatar from '@/assets/img/default_avatar.jpeg'

export default {
  name: 'Detail',
  components: {
    HtmlContent
  },
  data () {
    return {
      defaultAvatar,
      bg: chrome.extension.getBackgroundPage().bg,
      loading: false,
      isShowReply: false,
      isShowReplyBtn: true,
      isFocus: false,
      showCollapse: false,
      viewer: null,
      userInfo: {},
      subject: '',
      list: [],
      listMap: {},
      authorId: '',
      form: {
        action: 'reply',
        fid: '',
        tid: '',
        lite: 'htmljs',
        post_content: '',
        nojump: 1,
        step: 2
      },
      rules: {
        post_content: [
          {
            required: true,
            message: '内容不能为空'
          },
          {
            min: 4,
            message: '内容过短'
          },
          {
            max: 420,
            message: '内容过长'
          }
        ]
      },
      actions: [
        { type: 'star-o', text: '156' },
        { type: 'like-o', text: '156' },
        { type: 'message', text: '2' }
      ],
      params: {
        tid: this.$route.query.tid,
        page: 1
      },
      pageParams: {
        page: 1,
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
  methods: {
    filterContent,
    transferAnonyName,
    transferComment,
    handleChangePage (page) {
      this.params.page = page
      this.getList()
    },
    getList (goBottom) {
      this.loading = true

      // 获取楼层信息
      this.bg.getPostDetail({
        ...this.params
      }, (res) => {
        this.loading = false
        const { __R, __U, __T, __MESSAGE } = res.data

        if (__MESSAGE && __MESSAGE[1]) {
          this.subject = __MESSAGE[1]
          this.isShowReplyBtn = false
          return this.$message.warning(__MESSAGE[1])
        }

        this.subject = __T.subject
        this.form.fid = __T.fid
        this.form.tid = __T.tid

        // 楼层用户信息
        this.userInfo = {
          ...this.userInfo,
          ...__U
        }

        this.list = Object.keys(__R).map((item) => __R[item])
        this.authorId = __T.authorid
        this.pageParams.page = res.data.__PAGE
        this.pageParams.pageSize = res.data.__R__ROWS
        this.pageParams.total = res.data.__ROWS

        if (!goBottom) {
          window.scrollTo(0, 0)
        } else {
          window.scrollTo(0, 99999)
        }

        this.checkFocus()
        this.initImgViewer()
      })
    },
    initImgViewer () {
      this.viewer && this.viewer.destroy()
      setTimeout(() => {
        this.viewer = new Viewer(document.querySelectorAll('.post-list')[0], {
          filter (image) {
            return image.classList.contains('content-img')
          },
          url (image) {
            return image.getAttribute('data-source') || image.src
          },
          button: false,
          focus: false,
          fullscreen: false,
          loop: false,
          rotatable: false,
          scalable: false,
          slideOnTouch: false,
          title: false,
          toggleOnDblclick: false,
          toolbar: false,
          tooltip: false,
          transition: false,
          zoomOnTouch: false
        })
      }, 1000)
    },
    getAvatar (avatar) {
      if (typeof avatar === 'string') {
        return avatar
      }
      if (typeof avatar === 'object') {
        return avatar[0] || avatar[1]
      }
    },
    checkFocus () {
      this.bg.searchFocus(this.params.tid, (items) => {
        const data = items[0]

        if (data) {
          this.isFocus = true
        } else {
          this.isFocus = false
        }
      })
    },
    focus () {
      if (!this.isFocus) {
        const item = this.list[0]
        const data = {
          tid: this.params.tid,
          subject: item.subject,
          author: this.userInfo[item.authorid] ? transferAnonyName(this.userInfo[item.authorid].username)[0] : `UID:${item.authorid}`,
          postdate: item.postdate,
          replies: this.pageParams.total
        }
        this.bg.saveFocus(this.params.tid, data, () => {
          this.isFocus = true
          this.bg.startCheckImg(data)
        })
      }
    },
    triggerReply () {
      this.isShowReply = !this.isShowReply
    },
    handleSubmit (e) {
      e.preventDefault()
      this.$refs.ruleForm.validate((valid) => {
        if (valid) {
          this.bg.postReply({
            ...this.form
          })
          this.$nextTick(() => {
            this.form.post_content = ''
            this.triggerReply()
          })
          setTimeout(() => {
            this.params.page = 'e'
            this.getList(true)
          }, 1000)
        }
      })
    },
    showAttachImg (e) {
      const imgEle = e.target.querySelector('.attach-img')
      const txtEle = e.target.querySelector('span')
      console.log(imgEle, txtEle)

      imgEle.style.display = 'block'
      txtEle.style.display = 'none'
    },
    handleClickAttach (data) {
      window.open(this.bg.config.imgBaseApi + data.attachurl)
    },
    jumpToOrigin () {
      window.open(`${this.bg.config.detailApi}?tid=${this.params.tid}`)
    },
    goBack () {
      this.$router.back()
    }
  }
}
</script>

<style lang="scss">
.option-app-detail {
  .header {
    background-color: #fff;
    border: 1px solid rgb(235, 237, 240)
  }
  .post-list {
    padding: 15px 20px;
  }
  .left {
    float: left;
  }
  .right {
    float: right;
  }
  .time {
    display: inline-block;
    font-size: 12px;
    color: #888;
    opacity: .5;
  }
  .lou {
    margin-left: 5px;
    font-size: 12px;
  }
  .pagination {
    padding: 20px;
    text-align: center;
  }
  .de-action {
    cursor: default;
    &:hover {
      color: rgba(0, 0, 0, 0.45);
    }
  }
  .comment {
    margin-bottom: 15px;
    padding: 0 15px;
    background-color: #f3f5f7;
  }
  .attach-list {
    display: flex;
    flex-wrap: wrap;
    align-items: stretch;
    .attach-item {
      margin-right: 10px;
      margin-bottom: 10px;
      width: 250px;
      flex: 0 1 auto;
      cursor: pointer;
      .attach-img {
        width: 100%;
      }
    }
  }
}
</style>
