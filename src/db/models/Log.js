const mongoose = require(`mongoose`);
const {Schema} = mongoose;

const Log = new Schema({
    message: String,
    createdAt: {
        type:Date,
        default: Date.now()
    },

});

Log.statics.appendLog = function({msg}) {
    const log = new this({
        msg
    });
    return log.save();
};

module.exports = mongoose.model('Log', Log);
