// Load required packages
var mongoose = require('mongoose');
//var Schema = require('mongoose')
// Define our user schema
var UserSchema = new mongoose.Schema({
    _id: {type: String, auto: true, required: true}, 
    currentApartments: {type: Array},
    savedApartments: {type: Array},
    cellPhone: {type: String, required: true},
    email: {type: String, required: true},
    name: {type: String, required: true}
});

// Export the Mongoose model
module.exports = mongoose.model('User', UserSchema);
