const axios = require('axios');
const cheerio = require('cheerio');

exports.crawling = async (ctx) => {
  // const dateString = '2020-05-05 00:08:00';
  const {body} = ctx.request;

  const {uri, dateString} = body;
  //http://www.k-apt.go.kr/bid/bidList.do?type=4&bid_area=&bid_num=&bid_no=&d_time=1588587015395&search_bid_gb=bid_gb_1&bid_title=&apt_name=&search_date_gb=reg&date_start=2020-01-05&date_end=2021-01-05&date_area=4&bid_state=&code_auth=&code_way=&code_auth_sub=&code_classify_type_1=02&code_classify_type_2=05&code_classify_type_3=16

  try {
    const url = await axios.get(
        uri +
        '&pageNo=1', {
          headers: {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.113 Safari/537.36',
          },
        });

    let $ = cheerio.load(url.data);
    const data = $('.paginate_complex a');

    const size = data.length + 1;
    const linkobj = {};
    let dateCheck = '';

    for (let i = 0; i !== size + 1; ++i) {
      const body = await axios.get(
          uri +
          '&pageNo=' + (i + 1), {
            headers: {
              'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.113 Safari/537.36',
            },
          }).then(value => new Promise(resolve => {
        setTimeout(() => {
          resolve(value);
        }, 500);
      }));
      $ = cheerio.load(body.data);
      const links = $('#tblBidList tbody tr');

      links.each(async (index, element) => {
        const no = $(element).children().eq(0).text();
        const date = $(element).children().eq(7).text();

        // date를 비교해서  보내온 date 이후의 데이터 전달
        if (date > dateString || dateString === 0) {
          const onclick = $(element).attr('onclick');
          const strarr = onclick.split('\'');

          console.log(date);
          if (date > dateCheck) dateCheck = date;

          const data = await getUrlData(strarr[1]);
          linkobj[no] = {
            data,
            date,
          };
        }
      });
    }
    linkobj['dateString'] = dateCheck;
    ctx.body = linkobj;
  } catch (e) {
    console.error(e);
  }

};

async function getUrlData(urlString) {
  try {
    const body = await axios.get(
        'http://www.k-apt.go.kr/bid/bidDetail.do?pageNo=9&type=4&bid_area=&bid_no=&d_time=1588573772185&search_bid_gb=bid_gb_1&bid_title=&apt_name=&search_date_gb=reg&date_start=2020-01-05&date_end=2021-01-05&date_area=4&bid_state=&code_auth=&code_way=&code_auth_sub=&code_classify_type_1=02&code_classify_type_2=05&code_classify_type_3=16' +
        '&bid_num=' + urlString);

    const $ = cheerio.load(body.data);

    const data = $('.table_new tbody tr td');

    // #subContents > section.subContent > div.contentBox > table:nth-child(1) > tbody > tr:nth-child(2) > td:nth-child(1)
    const obj = {};
    data.each((index, element) => {

      function replaceAll(str, searchStr, replaceStr) {
        return str.split(searchStr).join(replaceStr);
      }

     /* if (index === 11) {
        if ($(element).children('#emrg_bid_n').attr('checked') === 'checked') {
          obj[index] = '일반';
          return true;
        } else {
          obj[index] = '긴급';
          return true;
        }
      } else if (index === 16) {

        if ($(element).children('#isFiledDesP').attr('checked') === 'checked') {
          obj[index] = '필수';
          return true;
        } else if ($(element).children('#isFiledDesY').attr('checked') ===
            'checked') {
          obj[index] = '임의';
          return true;
        } else {
          obj[index] = '없음';
          return true;
        }

      } else if (index === 20) {
        if ($(element).children('#bid_req_docs_y').attr('checked') ===
            'checked') {
          obj[index] = '있음';
          return true;
        } else if ($(element).children('#bid_req_docs_n').attr('checked') ===
            'checked') {
          obj[index] = '없음';
          return true;
        }
      }*/

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