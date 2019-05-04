var db = require('../db.js');
var apartment = require('../models/apartment.js');
var user = require('../models/user.js');
var helper = require('../helper.js');
var ObjectId = require('mongodb').ObjectID;

// Removes apartment id from current and saved arrays of users
async function handleApartmentDelete(id){
    let apt = await apartment.findOne({_id: id})
    let result = await user.updateOne({ "_id": apt.UserID }, { $pull: { CurrentApartments: id }});
    await user.updateMany({
    }, {$pull: { SavedApartments: id.toString()}}, {multi: true});
}

// Finds all apartments inside user currentApartment array and properly deletes them
async function handleUserDelete(id){
    let k = await user.findOne({"_id": id});
    await user.update({}, {$pull: { SavedApartments: {$in: k.CurrentApartments }}}, {multi: true});
    k.CurrentApartments.forEach(async aptID => {
         if (aptID != {}){
            await handleApartmentDelete(aptID);
        }
    });
    await apartment.deleteMany({ UserID: id});
}

async function getApt(req, res, next){
    try {
    	let id = req.params.id
        // checks if apartment exists
        let k = await apartment.findOne({ "_id": id});
        if (k == null) {
            throw Error;
        }
        // If apartment is found, return
        res.status(200).json({"message" : "Got apartment", "data": k});
    }
    catch (err) {
        res.status(404).json({ "message": "Apartment ID not found", "data": err });
    }
}

async function updateApt(req, res, next){
    try {
        let id = req.params.id
        await user.updateOne({ _id: (await apartment.findOne({_id: id})).UserID }, { $pull: { CurrentApartments: id }});
        // find and update given apartment (validation run through parameter)
        let k =  apartment.findOneAndUpdate({ "_id": id }, {
            LatLong: req.body.LatLong,
            Address: req.body.Address,
            StartDate: req.body.StartDate,
            EndDate: req.body.EndDate,
            Bedrooms: req.body.Bedrooms,
            Bathrooms: req.body.Bathrooms,
            UserID: req.body.UserID,
            ImageURL: req.body.ImageURL
        }, { runValidators: true });

        await user.updateOne({ _id: k.UserID }, { $push: { CurrentApartments: id }});
        await res.status(201).json({ "message" : "Updated apartment", "data": await apartment.findOne(k)});
    } catch (err) {
        res.status(404).json({ "message" : "Could not update apartment", data: err });
    }
}

async function deleteApt(req, res, next) {
    try {
    	let id = req.params.id
        // If apartment isn't found
        if (await apartment.find({ "_id": id}).count() == 0){
            throw Error;
        }
        // If apartment is found, delete
        await handleApartmentDelete(ObjectId(id));
        await apartment.findOneAndDelete({ "_id": id });
        res.status(200).json({"message": "Deleted apartment"});
    }
    catch (err) {
        res.status(404).json({"message": "Apartment ID not found", "data": err })
    }
}

async function getApts(req, res, next){
        // Count parameter
       if (req.query.count == 1){
           var outApartment = await apartment.find(helper.checkForNull(req.query.where)).count();
       }
       else {
           var outApartment = await apartment.find(helper.checkForNull(req.query.where))
               .limit(helper.getNumber(req.query.limit))
               .select(helper.checkForNull(req.query.select))
               .skip(helper.getNumber(req.query.skip))
               .sort(helper.checkForNull(req.query.sort));
       }
       res.status(200).json({"message" : "Got apartments", "data": outApartment});
    }

async function createApt(req, res, next) {
        // Makes new apartment with specifications
    var newApartment = new apartment({
        LatLong: req.body.LatLong,
        Address: req.body.Address,
        StartDate: req.body.StartDate,
        EndDate: req.body.EndDate,
        Bedrooms: req.body.Bedrooms,
        Bathrooms: req.body.Bathrooms,
        UserID: req.body.UserID,
        ImageURL: req.body.ImageURL
    })
        
    try {
        // If user ID specified in body is invalid, do not post
        if (await user.find({ _id: req.body.UserID }).count() == 0){
            throw Error;
        }
        // Updates all users by deleting the apartment id from their list of current apartments
        await user.updateOne({ _id: newApartment.UserID}, { $push: { CurrentApartments: newApartment._id }});
        await newApartment.save();
        res.status(201).json({"message" : "Created new apartment", "data": newApartment});
    }
    catch (err) {
        res.status(400).json({"message" : "Could not create apartment, invalid parameters", data: err});
    }
}

// TODO: get list of apts based on lat-long distance from it
// TODO: userId and apt to add to current apartments
async function addToCurrentApts(req, res, next) {
    let userID = req.params.userid
    let aptID = req.body.AptID

    if (await user.find({ _id: userID }).countDocuments() == 0){
        res.status(400).json({"message" : "Could not add apartment, user ID not found" });
        return;
    }
    let result = await user.updateOne({ _id: userID}, { $push: { CurrentApartments: aptID }});
    res.status(201).json({ "message": `Apartment ${aptID} added to User ${userID}\'s CurrentApartments`, data: result });
    return;
}

// TODO: userId and apt to add to saved apartments
async function addToSavedApts(req, res, next) {
    let userID = req.params.userid
    let aptID = req.body.AptID

    if (await user.find({ _id: userID }).countDocuments() == 0){
        res.status(400).json({"message" : "Could not add apartment, user ID not found" });
        return;
    }
    let result = await user.updateOne({ _id: userID}, { $push: { SavedApartments: aptID }});
    res.status(201).json({ "message": `Apartment ${aptID} added to User ${userID}\'s SavedApartments`, data: result });
    return;
}

// remove apt from user's saved apartments
async function removeFromSavedApts(req, res, next) {
    let userID = req.params.userid
    let aptID = req.body.AptID

    console.log("Apt ID: " + aptID);

    if (await user.find({ _id: userID }).countDocuments() == 0){
        res.status(400).json({"message" : "Could not remove apartment, user ID not found" });
        return;
    }
    let result = await user.updateOne({ _id: userID}, { $pull: { SavedApartments: aptID }});
    res.status(201).json({ "message": `Apartment ${aptID} removed from User ${userID}\'s SavedApartments`, data: result });
    return;
}

async function getNearbyApts(req, res, next) {
    let lat = req.body.Lat
    let long = req.body.Long 
    let mileRadius = req.body.miles

    //Math.cos(lat)
}


module.exports = {
	getApt: getApt,
	handleApartmentDelete: handleApartmentDelete,
	handleUserDelete: handleUserDelete,
	updateApt: updateApt,
	deleteApt: deleteApt,
	getApts: getApts,
	createApt: createApt,
    addToCurrentApts: addToCurrentApts,
    addToSavedApts: addToSavedApts,
    removeFromSavedApts: removeFromSavedApts
};