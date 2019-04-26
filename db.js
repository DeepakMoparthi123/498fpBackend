const mongoose = require('mongoose');
const secrets = require('./config/secrets')

mongoose.connect(secrets.mongo_connection,  { useNewUrlParser: true });

mongoose.set('useCreateIndex', true);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('Database is connected!');
});

module.exports = db;