<template>
  <div class="post-content" @click="handleClick" v-html="html"></div>
</template>
<script>
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
  .collapse_btn {
    margin: 0 8px 12px 0;
    line-height: 1.499;
    position: relative;
    display: inline-block;
    font-weight: 400;
    white-space: nowrap;
    text-align: center;
    background-image: none;
    box-shadow: 0 2px 0 rgb(0 0 0 / 2%);
    cursor: pointer;
    transition: all .3s cubic-bezier(.645,.045,.355,1);
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    touch-action: manipulation;
    height: 32px;
    padding: 0 15px;
    font-size: 14px;
    border-radius: 4px;
    color: rgba(0,0,0,.65);
    background-color: #fff;
    border: 1px solid #d9d9d9;
  }
  .collapse_block {
    display: none;
  }
}
</style>
