<template>
  <div class="option-app-focus">
    <a-row>
      <a-col :span="16">
        <a-form layout="inline" :label-col="{ span: 4 }" :wrapper-col="{ span: 20 }">
          <a-form-item label="扫描周期">
            <a-select :default-value="interval" style="width: 120px" @change="handleIntervalChange">
              <a-select-option :value="5000">5秒</a-select-option>
              <a-select-option :value="10000">10秒</a-select-option>
              <a-select-option :value="30000">30秒</a-select-option>
              <a-select-option :value="60000">1分钟</a-select-option>
            </a-select>
            <span class="form-item-tip">上次扫描时间：{{ formatTime(bg.config.lastIntervalCheck) }}</span>
          </a-form-item>
          <a-form-item :label-col="{ span: 20 }" :wrapper-col="{ span: 4 }" label="模糊图片(防社死)">
            <a-switch :default-checked="pixelate" @change="handlePixelateChange" />
          </a-form-item>
        </a-form>
      </a-col>
      <a-col :span="8" style="text-align: right;">
        <span v-if="checkStatus">
          <a-icon type="sync" spin />扫描中...
        </span>
        <a-button :type="checkStatus ? '' : 'primary'" @click="triggerCheck">
          {{ checkStatus ? '取消扫描' : '开始扫描' }}
        </a-button>
        <a-button style="margin-left: 10px;" type="danger" @click="clearFocus">清空关注列表</a-button>
      </a-col>
    </a-row>

    <a-table
      :columns="columns"
      :data-source="list"
      :pagination="false"
      :expandIcon="customExpandIcon"
      @expandedRowsChange="handleExpand"
    >
      <div slot="subject" slot-scope="text, record">
        <a slot="title" @click="jumpToOrigin(record)">
          {{ record.subject }}
          <a-icon type="link" />
        </a>
      </div>
      <div slot="postdate" slot-scope="text, record">
        {{ record.postdate }}
      </div>
      <div slot="expandedRowRender" slot-scope="record" style="margin: 0">
        <a-list item-layout="horizontal" :data-source="record.imgList">
          <a-list-item slot="renderItem" slot-scope="item">
            <div>
              <template v-for="val in item.attachs">
                <img
                  :class="{'blur-img': pixelate, 'default-img': true}"
                  v-if="val.type === 'img'"
                  :key="val.name"
                  :src="val.attachurl.match(/^http/) ? val.attachurl : `${item.baseUrl}${val.attachurl}`"
                  @click="handleClickImg"
                />
              </template>
            </div>
          </a-list-item>
        </a-list>
      </div>
      <div slot="status" slot-scope="text, record">
        <template v-if="record.error">
          <span class="error-txt">{{ record.error.message }}</span>
        </template>
        <template v-else>
          <span class="success-txt">正常</span>
        </template>
      </div>
      <div slot="times" slot-scope="text, record">
        {{ record.checkTimes }}
      </div>
      <div slot="images" slot-scope="text, record">
        {{ record.imgList.map(item => item.attachs.length).reduce((acc, curr) => acc + curr, 0) }}
      </div>
      <div class="action" slot="action" slot-scope="text, record">
        <a-button type="primary" @click="download(record)" :loading="record.downloadLoading" :disabled="record.downloadLoading">下载</a-button>
        <a-button type="danger" @click="removeFocus(record)">取消关注</a-button>
      </div>
    </a-table>
  </div>
</template>

<script>
import Jszip from 'jszip'
import { saveAs } from 'file-saver'
import { formatTime } from '@/utils'

export default {
  name: 'Focus',
  data () {
    const bg = chrome.extension.getBackgroundPage().bg
    return {
      bg,
      interval: bg.config.intervalTime,
      pixelate: bg.config.pixelate,
      checkStatus: !!bg.config.intervalOpen,
      columns: [
        {
          title: '帖子id',
          dataIndex: 'tid'
        },
        {
          title: '标题',
          dataIndex: 'subject',
          width: 350,
          scopedSlots: { customRender: 'subject' }
        },
        {
          title: '作者',
          dataIndex: 'author'
        },
        {
          title: '发帖时间',
          dataIndex: 'postdate',
          scopedSlots: { customRender: 'postdate' }
        },
        {
          title: '帖子状态',
          key: 'status',
          scopedSlots: { customRender: 'status' }
        },
        {
          title: '扫描次数',
          key: 'times',
          scopedSlots: { customRender: 'times' }
        },
        {
          title: '图片数',
          key: 'images',
          scopedSlots: { customRender: 'images' }
        },
        {
          title: '操作',
          key: 'action',
          scopedSlots: { customRender: 'action' }
        }
      ],
      list: []
    }
  },
  created () {
    this.getList()
    // 监听storage变化
    chrome.storage.onChanged.addListener(this.getList)
  },
  beforeDestroy () {
    // 清除storage监听
    chrome.storage.onChanged.removeListener(this.getList)
  },
  watch: {
    'bg.config.intervalOpen' (val) {
      this.checkStatus = val
    }
  },
  methods: {
    formatTime,
    customExpandIcon (props) {
      const { record, expanded, onExpand } = props

      if (expanded) {
        return (<a-icon type="minus-square" onClick={onExpand} />)
      } else {
        if (record.newImgLength > 0) {
          return (
            <a-badge
              count={record.newImgLength}
              offset={[10, -10]}
            >
              <a-icon type="plus-square" onClick={onExpand} />
            </a-badge>
          )
        } else {
          return (<a-icon type="plus-square" onClick={onExpand} />)
        }
      }
    },
    // 展开后重置新图片数
    handleExpand (id) {
      this.bg.searchFocus(id, (items) => {
        if (items.length) {
          const data = items[0]

          data.newImgLength = 0

          this.bg.saveFocus(id, data, () => {
            this.bg.tipNewImg()
          })
        }
      })
    },
    handleIntervalChange (val) {
      this.bg.saveConfig({
        intervalTime: val
      })
    },
    handlePixelateChange (val) {
      this.bg.saveConfig({
        pixelate: val
      })
      this.pixelate = val
    },
    triggerCheck () {
      if (!this.checkStatus) {
        this.bg.openCheckFocus()
        this.checkStatus = true
      } else {
        this.bg.cancelCheckFocus()
        this.checkStatus = false
      }
    },
    getList () {
      this.bg.getAllFocus((items) => {
        this.list = items.map((item) => {
          return {
            key: item.tid,
            downloadLoading: false,
            ...item
          }
        })
      })
    },
    handleClickImg (e) {
      const target = e.target
      if (target.classList.contains('default-img')) {
        target.classList.add('active-img')
        target.classList.remove('default-img')
        return false
      }
      if (target.classList.contains('active-img')) {
        target.classList.add('default-img')
        target.classList.remove('active-img')
        return false
      }
    },
    removeFocus (data) {
      this.$confirm({
        title: '取消关注',
        content: '取消关注后，已搜集的图片将被删除，请提前下载。是否取消关注？',
        okText: '确定',
        cancelText: '取消',
        onOk: () => {
          this.bg.removeFocus(data.tid, () => {
            this.bg.tipNewImg()
          })
        },
        onCancel () {}
      })
    },
    clearFocus () {
      this.$confirm({
        title: '取消所有关注',
        content: '取消所有关注，已搜集的图片将被删除，请提前下载。是否取消关注？',
        okText: '确定',
        cancelText: '取消',
        onOk: () => {
          this.bg.clearFocus(() => {
            this.bg.tipNewImg()
          })
        },
        onCancel () {}
      })
    },
    download (data) {
      const zip = new Jszip()
      let imgCount = 0

      if (data.imgList.length) {
        data.downloadLoading = true
        const imgFolder = zip.folder('images')
        data.imgList.forEach((item) => {
          item.attachs.forEach((val) => {
            if (val.type === 'img') {
              imgCount++
              const url = val.attachurl.match(/^http/) ? val.attachurl : `${item.baseUrl}${val.attachurl}`
              this.bg.getRemoteImgBinary(url, function (res) {
                imgFolder.file(`${val.name}.${val.ext}`, res.data, { binary: true })
                imgCount--
                if (imgCount === 0) {
                  zip.generateAsync({ type: 'blob' }).then(function (content) {
                    data.downloadLoading = false
                    saveAs(content, `${formatTime(new Date(), '{y}-{m}-{d}')}-${data.tid}.zip`)
                  })
                }
              })
            }
          })
        })
      } else {
        this.$message.error('没有图片可供下载')
      }
    },
    jumpToOrigin (data) {
      window.open(`${this.bg.config.detailApi}?tid=${data.tid}`)
    }
  }
}
</script>

<style lang="scss">
.option-app-focus {
  .default-img {
    margin-right: 10px;
    width: 100px;
    cursor: zoom-in;
  }
  .blur-img {
    filter: blur(5px);
  }
  .active-img {
    margin-right: 10px;
    width: 400px;
    cursor: zoom-out;
    filter: blur(0);
  }
  .action {
    button {
      margin-right: 10px;
    }
  }
  .form-item-tip {
    margin-left: 10px;
    font-size: 12px;
    color: #999;
  }
  .error-txt {
    color: #f5222d;
  }
  .success-txt {
    color: #52c41a;
  }
}
</style>
