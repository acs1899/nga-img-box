<script>
import vue from 'dist/vue.esm.js'
export default {
  name: 'HtmlContent',
  props: ['html'],
  data () {
    return {
      showCollapse: false
    }
  },
  methods: {
    handleClick (e) {
      const target = e.target
      if (target.classList.contains('collapse_btn')) {
        this.showCollapse = true
      }
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
    }
  },
  render (h) {
    return h(vue.compile(`<div class="post-content">${this.html}</div>`), {
      class: {
        'active-collapse': this.showCollapse
      },
      nativeOn: {
        click: this.handleClick
      }
    })
  }
}
</script>

<style lang="scss">
.post-content {
  .del {
    text-decoration: line-through;
    color: gray;
  }
  .facebread {
    vertical-align: -12px;
  }
  .content-img {
    display: inline-block;
    margin: 2px;
  }
  .default-img {
    width: 100px;
    cursor: zoom-in;
  }
  .active-img {
    display: block;
    width: 100%;
    cursor: zoom-out;
  }
  .quote {
    padding: 10px 15px;
    background-color: #f3f5f7;
  }
  .collapse_block {
    display: none;
  }
  &.active-collapse {
    .collapse_block {
      display: block;
    }
  }
  &.active-collapse {
    .collapse_btn {
      display: none;
    }
  }
}
</style>
