<script>
import vue from 'dist/vue.esm.js'
export default {
  name: 'HtmlContent',
  props: ['html'],
  data () {
    return {}
  },
  methods: {
    handleClick (e) {
      const target = e.target
      if (target.classList.contains('collapse_btn')) {
        target.style.display = 'none'
        target.nextElementSibling.style.display = 'block'
      }
    }
  },
  render (h) {
    return h(vue.compile(`<div class="post-content">${this.html}</div>`), {
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
  .quote {
    padding: 10px 15px;
    background-color: #f3f5f7;
  }
  .collapse_block {
    display: none;
  }
}
</style>
