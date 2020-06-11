const koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const cors = require('@koa/cors');


const api = require('./api');

const app = new koa();
app.use(cors());
app.use(bodyParser());

const router = new Router();
router.use('/api', api.routes());

app.use(router.routes());
app.use(router.allowedMethods());

app.use(ctx => {
  ctx.body = 'Hello koa!';
});

var port = process.env.PORT || 4001;

router.get('/', (ctx, next) => {
  ctx.body = ' 루트페이지 입니다.';
});
app.listen(port, () => {
  console.log('Koa server is listening to port 4000');
});
