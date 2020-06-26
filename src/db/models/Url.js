const mongoose = require(`mongoose`);
const {Schema} = mongoose;

const Url = new Schema({
  link: {
    type:String,
  },
  emails: [String],
  updateDate: String,
});

Url.statics.findByUrl = function(link) {
  link = link.replace(/'?pageNo=\d*&/, '');
  link = link.replace(/&pageNo=\d*/, '');
  return this.findOne({link}).exec();
};
Url.statics.registerUrl = function({link, updateDate, emails}) {
  const url = new this({
    link,
    emails,
    updateDate,
  });
  return url.save();
};
Url.statics.findAll = function() {
  return this.find({}).exec();
};
Url.statics.updateByUrl = function(link, updateDate) {
  return this.updateOne({link}, {$set: {updateDate}}).exec();
};
module.exports = mongoose.model('Url', Url);