const Url = require('../../../db/models/Url');

exports.addemail = async (ctx) => {
  const {body} = ctx.request;
  const {url, email} = body;

  if (!email || !url) {
    ctx.status = 400;
    return;
  }
  try {
    const link = await Url.findByUrl(url);
    if (!link) {
      ctx.status = 400;
      return;
    }

    const confirm_email = link.emails.find((item) => {
      return item == email;
    });
    if (!confirm_email) {
      console.log('confirm_email');
      link.emails.push(email);

      link.save({
        emails: link.emails,
      });

      ctx.body = {
        success: true,
      };
    } else {
      console.log('!confirm_email');
      ctx.status = 400;
      return;
    }

  } catch (e) {
    ctx.throw(e, 500);
  }

};
exports.checkUrl = async (ctx) => {
  const {body} = ctx.request;
  const {url} = body;

  if (!url) {
    ctx.status = 400;
    return;
  }
  try {
    //URL 패치
    let link = url.replace(/'?pageNo=\d*&/, '');
    link = link.replace(/&pageNo=\d*/, '');

    const account = await Url.findByUrl(link);

    if (!!account) {
      //링크가 이미 존재하면
      ctx.body = {
        exists: !!account,
        emails: account.emails,
      };
    } else {
      // 링크가 존재하지 않으면 생성
      Url.registerUrl({link, updateDate: 0, emails: []});
      ctx.body = {exists: !!account};
    }
  } catch (e) {
    ctx.throw(e, 500);
  }
};
