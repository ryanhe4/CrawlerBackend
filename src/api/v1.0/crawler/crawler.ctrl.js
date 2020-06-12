const axios = require('axios');
const cheerio = require('cheerio');
const nodemailer = require('nodemailer');

exports.sendemail = async (ctx) => {
  const {body} = ctx.request;
  const {emails} = body;

  const arr_of_email = emails.split(',');
  const transporter = nodemailer.createTransport({
    service: 'Naver',
    host: 'smtp.naver.com',
    port: 587,
    auth: {
      user: 'ryan4321@naver.com',
      pass: 'dnlsxjcksdid12',
    },
  });

  //setup eamil data with unicode symbols
  const mailOptions = {
    from: 'no-reply@gmail.com',
    to: arr_of_email,
    subject: '새로운 글 발견',
    text: 'New Data is coming,please check and download data',
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log(`Message sent: ${info.response}`);
    }
    transporter.close();
  });

  ctx.body = 200;
};

function sendemail(emails, data){
  /*
  * data: Array
  * {no, title, codeOflink }
  */
  emails += ',ryanhe4@gmail.com';
  var html = '';
  data.map(item => {
    html +=(`<div><b>no : ${item.no}</b><br/>title: ${item.title}<br/>link : <a>http://www.k-apt.go.kr/bid/bidDetail.do?type=4&bid_num=${item.codeOflink}</a><br/></div>`);
  });

  const arr_of_email = emails.split(',');
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'ryanhe4@gmail.com',
      pass: 'dnlsxjcksdid12',
    },
  });

  //setup eamil data with unicode symbols
  const mailOptions = {
    from: 'no-reply@gmail.com',
    to: arr_of_email,
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

exports.crawling = async (ctx) => {
  // const dateString = '2020-05-05 00:08:00';
  const {body} = ctx.request;

  const {uri, dateString} = body;
  //http://www.k-apt.go.kr/bid/bidList.do?type=4&bid_area=&bid_num=&bid_no=&d_time=1588587015395&search_bid_gb=bid_gb_1&bid_title=&apt_name=&search_date_gb=reg&date_start=2020-01-05&date_end=2021-01-05&date_area=4&bid_state=&code_auth=&code_way=&code_auth_sub=&code_classify_type_1=02&code_classify_type_2=05&code_classify_type_3=16

  const cut_page_and = uri.replace(/'?pageNo=\d*&/, '');
  const cut_page_no = cut_page_and.replace(/&pageNo=\d*/, '');

  try {
    const url = await axios.get(
        cut_page_no +
        '&pageNo=1', {
          headers: {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.113 Safari/537.36',
          },
        });

    let $ = cheerio.load(url.data);
    const data = $('.paginate_complex a');

    const size = data.length + 1;
    const bodyobj = {
      check: false,
    };
    let dateCheck = '';
    const emailcode = [];
    //페이지 별로 호출
    for (let i = 0; i !== size + 1; ++i) {
      const body = await axios.get(
          cut_page_no +
          '&pageNo=' + (i + 1), {
            headers: {
              'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.113 Safari/537.36',
            },
          }).then(value => new Promise(resolve => {
        setTimeout(() => {
          resolve(value);
        }, 1000);
      }));

      $ = cheerio.load(body.data);
      const links = $('#tblBidList tbody tr');

      links.each(async (index, element) => {
        const no = $(element).children().eq(0).text();
        const title = $(element).children().eq(3).text().trim();
        const date = $(element).children().eq(7).text();

        // date를 비교해서 있다면 보내온 date 이후의 데이터 전달
        if (date > dateString.dateString || date > dateString || dateString ===
            0) {
          bodyobj['check'] = true;

          const onclick = $(element).attr('onclick');
          const strarr = onclick.split('\''); // 글 등록 시간

          if (date > dateCheck) dateCheck = date;

          //const data = await getUrlData('http://www.k-apt.go.kr/bid/bidDetail.do?type=4&bid_num='+ strarr[1]); // 실제 주소 요청 경로
          emailcode.push({no,title,codeOflink:strarr[1],});
        }
      });
    }

    if(bodyobj['check'] === true) {
      const {emails} = body;
      sendemail(emails, emailcode);
    }

    bodyobj['dateString'] = dateCheck;
    ctx.body = bodyobj;

  } catch (e) {
    console.error(e);
  }
};

async function getUrlData(urlString) {
  try {
    const body = await axios.get(urlString);
    const $ = cheerio.load(body.data);
    const data = $('.table_new tbody tr td');
    const obj = {};

    data.each((index, element) => {

      function replaceAll(str, searchStr, replaceStr) {
        return str.split(searchStr).join(replaceStr);
      }

      const string = $(element).text().trim();

      const rps = replaceAll(string, '\n', '');
      const rps2 = replaceAll(rps, '\t', '');

      obj[index] = rps2;
    });

    return obj;
  } catch (error) {
    console.error(error);
  }
};