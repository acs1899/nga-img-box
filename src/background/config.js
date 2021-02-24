const host = 'bbs.nga.cn'
const config = JSON.parse(localStorage.getItem('config')) || {}

export default {
  host,
  origin: `https://${host}`,
  listApi: `https://${host}/thread.php`,
  detailApi: `https://${host}/read.php`,
  replyApi: `https://${host}/post.php`,
  regionBaseApi: `https://${host}/?noprefix`,
  regionBase: '',
  regionApi: '/proxy/cache_attach/bbs_index_data.js?noprefix',
  faceApi: '/ngabbs',
  iconApi: '/proxy/cache_attach/ficon',
  imgBaseApi: '',
  sysImgApi: '/ngabbs/nga_classic',
  nukeApi: `https://${host}/nuke.php`,
  urls: [`https://${host}/*`, 'https://*.nga.178.com/*'],
  manifest: chrome.runtime.getManifest(),
  optionUrl: chrome.extension.getURL('options.html'),
  notifyId: 'nga-image-monitor-notify-id',
  notifyTimeoutId: -1,
  ngaCookie: [],
  ngaUid: '',
  regionMap: null,
  intervalOpen: config.intervalOpen || false,
  intervalTime: config.intervalTime || 5000,
  pixelate: config.pixelate || false,
  intervalCounter: null,
  lastIntervalCheck: new Date()
}
