// Load required packages
var mongoose = require('mongoose');

// Define our user schema
var ApartmentSchema = new mongoose.Schema({
    LatLong: {type:[], required: true},
    Address: {type: String, required: true}, 
    StartDate: {type: Date, required: true},
    EndDate: {type: Date, required: true},
    Bedrooms: {type: Number, default: undefined},
    Bathrooms: {type: Number, default: undefined},
    userID: {type: String, required: true}
});

// Export the Mongoose model
module.exports = mongoose.model('Apartment', ApartmentSchema);
