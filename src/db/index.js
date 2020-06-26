const mongoose = require('mongoose');
mongoose.set('useFindAndModify', false);

const mongoURI = "mongodb+srv://ryanhe4:admin@cluster0-adb7m.mongodb.net/crawler?retryWrites=true&w=majority"

module.exports = (function () {
  mongoose.Promise= global.Promise;
  return {
    connect() {
      mongoose.connect(mongoURI, {
        useNewUrlParser:true,
        useUnifiedTopology: true
      }).then(
          () =>{
            console.log(`Successfully connected to mongodb`);
          }
      ).catch(e => {
        console.error(e);
      });
    }
  };
})();