// Load required packages
var mongoose = require('mongoose');

// Define our user schema
var ApartmentSchema = new mongoose.Schema({
    Lat: {type: Number, required: true},
    Long: {type: Number, required: true},
    Address: {type: String, required: true}, 
    StartDate: {type: Date, required: true},
    EndDate: {type: Date, required: true},
    Bedrooms: {type: Number, default: undefined},
    Bathrooms: {type: Number, default: undefined},
    UserID: {type: String, required: true},
   	ImageURL: {type: String, default: 'https://www.google.com/url?sa=i&source=images&cd=&cad=rja&uact=8&ved=2ahUKEwjt5JXZz_7hAhUOUK0KHaW8BmkQjRx6BAgBEAU&url=%2Furl%3Fsa%3Di%26source%3Dimages%26cd%3D%26ved%3D%26url%3Dhttps%253A%252F%252Fcbdamericanshaman.com%252Fwater-soluble-full-spectrum-hemp-oil-30ml%26psig%3DAOvVaw37AF11wkHY4FckbGVORkg_%26ust%3D1556947501828534&psig=AOvVaw37AF11wkHY4FckbGVORkg_&ust=1556947501828534'}
});

// Export the Mongoose model
module.exports = mongoose.model('Apartment', ApartmentSchema);
