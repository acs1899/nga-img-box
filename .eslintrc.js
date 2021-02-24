module.exports = {
  root: true,
  env: {
    node: true,
    webextensions: true
  },
  globals: {
    $: 'readonly'
  },
  extends: [
    'plugin:vue/essential',
    '@vue/standard'
  ],
  parserOptions: {
    parser: 'babel-eslint'
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-new-func': 0,
    'no-control-regex': 0,
    'no-eval': 0
  }
}
