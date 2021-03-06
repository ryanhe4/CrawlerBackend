const koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const cors = require('@koa/cors');
const schedule = require('node-schedule');
const nodemailer = require('nodemailer');
const axios = require('axios');
const cheerio = require('cheerio');
const tor_axios = require('tor-axios');

const api = require('./api');
const db = require('./db');

db.connect();

const Url = require('./db/models/Url');
const Log = require('./db/models/Log');

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
    console.log('Koa server is listening to port 4000');
});

//10초마다 반복
const j = schedule.scheduleJob('*/30 * * * * 1-5 ', async () => {
    console.log(new Date().toTimeString(), '-반복실행');
    //링크리스트에
    const urls = await Url.findAll();
    for (let url of urls) {
        if (url.emails) {
            await crawler(url);
        }
    }
});

async function crawler(url) {
    const {link, emails, updateDate} = url;

    tor_test();

    const tor = tor_axios.torSetup({
        ip: 'localhost',
        port: 9050,
    })

    let check_new_data;
    try {
        check_new_data = false;
        let dateCheck = '0';
        const emailcode = [];
        //페이지 별로 호출
        const body = await tor.get(
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
            const ret = await sendemail(emails, emailcode);

            console.log(ret);
            //dateCheck => updateDate 변경
            if (!ret) await Url.updateByUrl(link, dateCheck);
        }
    } catch (e) {
        console.log(e);
    }
}

async function sendemail(emails, data) {
    /*
    * data: Array
    * {no, title, codeOflink }
    */
    var html = '';
    data.map(item => {
        html += (`<div><b>no : ${item.no}</b><br/> title: [${item.state}] ${item.title}<br/>link : <a>http://www.k-apt.go.kr/bid/bidDetail.do?type=4&bid_num=${item.codeOflink}</a><br/></div>`);
    });

    const transporter = nodemailer.createTransport({
        service: 'naver',
        host: 'smtp.naver.com',
        port: 587,
        auth: {
            user: 'ryan4321@naver.com',
            pass: process.env.MAILPASS
        },
    });

    //setup eamil data with unicode symbols
    const mailOptions = {
        from: '알림메일 <ryan4321@naver.com>',
        to: emails,
        subject: '새로운 글 발견',
        html,
    };

    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, async (error, info) => {
            if (error) {
                console.error(error);
                await Log.appendLog(error);
                transporter.close();
                resolve(1);
            } else {
                console.log(`Message sent: ${info.response}`);
                transporter.close();
                resolve(0);
            }
        })
    });
}

async function tor_test() {
    const tor = tor_axios.torSetup({
        ip: 'localhost',
        port: 9050,
    })

    let response = await tor.get('http://api.ipify.org');
    const ip = response.data;
    console.log(ip)
}
