const Router = require('koa-router');

const crawler = new Router();
const crawlerCtrl = require('./crawler.ctrl');

crawler.get('/',  (ctx) => {
  ctx.body = '라우터 설정 완료'
});

crawler.post('/getlink', crawlerCtrl.crawling);
crawler.post('/sendemail', crawlerCtrl.sendemail);

module.exports = crawler;