const Router = require('koa-router');
const crawler = require('./crawler');

const api = new Router();

api.use('/crawler', crawler.routes());

module.exports = api;

