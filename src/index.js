const koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const cors = require('@koa/cors');
const schedule = require('node-schedule');
const nodemailer = require('nodemailer');
const axios = require('axios');
const cheerio = require('cheerio');

const api = require('./api');
const db = require('./db');

db.connect();

const Url = require('./db/models/Url');

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

const port = process.env.PORT || 4001;

router.get('/', (ctx, next) => {
  ctx.body = ' 루트페이지 입니다.';
});
app.listen(port, () => {
  console.log('Koa server is listening to port 4001');
});

//10초마다 반복
const j = schedule.scheduleJob('*/10 * * * * * ', async () => {
  console.log(new Date(), '10분마다 실행');
  //링크리스트에
  const urls = await Url.findAll();
  for (let url of urls) {
    console.log(url.emails);
    if (url.emails) {
      await crawler(url);
    }
  }

  //sendemail(emails) //이메일 전송
});

async function crawler(url) {
  const {link, emails, updateDate} = url;

  let check_new_data;
  try {
    check_new_data = false;

    let dateCheck = '0';
    const emailcode = [];
    //페이지 별로 호출
    const body = await axios.get(
        link +
        '&pageNo=1', {
          headers: {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.113 Safari/537.36',
          },
        }).then(value => new Promise(resolve => {
      setTimeout(() => {
        resolve(value);
      }, 500);
    }));

    let $ = cheerio.load(body.data);
    const links = $('#tblBidList tbody tr');

    links.each(async (index, element) => {
      const no = $(element).children().eq(0).text();
      const title = $(element).children().eq(3).text().trim();
      const state = $(element).children().eq(5).text().trim();
      const date = $(element).children().eq(7).text();

      // date를 비교해서 있다면 보내온 date 이후의 데이터 전달
      if (date > updateDate || updateDate ===
          '0') {
        check_new_data = true;

        const onclick = $(element).attr('onclick');
        const strarr = onclick.split('\''); // 글 등록 시간

        if (date > dateCheck) dateCheck = date;
        emailcode.push({no, title, state, codeOflink: strarr[1]});
      }
    });

    if (check_new_data === true) {
      sendemail(emails, emailcode);
      //dateCheck => updateDate 변경
      const current = await Url.updateByUrl(link, dateCheck);
    }
  } catch (e) {
    console.log(e);
  }
}

function sendemail(emails, data) {
  /*
  * data: Array
  * {no, title, codeOflink }
  */
  var html = '';
  data.map(item => {
    html += (`<div><b>no : ${item.no}</b><br/> title: [${item.state}] ${item.title}<br/>link : <a>http://www.k-apt.go.kr/bid/bidDetail.do?type=4&bid_num=${item.codeOflink}</a><br/></div>`);
  });

  console.log(emails);

  const transporter = nodemailer.createTransport({
    service: 'naver',
    host: 'smtp.naver.com',
    port: 587,
    auth: {
      user: 'ryan4321@naver.com',
      pass: process.env.MAILPASS,
    },
  });

  //setup eamil data with unicode symbols
  const mailOptions = {
    from: 'ryan4321@naver.com',
    to: emails,
    subject: '새로운 글 발견',
    html,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log(`Message sent: ${info.response}`);
    }
    transporter.close();
  });
}
