var db = require('../db.js');
var apartment = require('../models/apartment.js');
var user = require('../models/user.js');
var helper = require('../helper.js');
var ObjectId = require('mongodb').ObjectID;

// Removes apartment id from current and saved arrays of users
async function handleApartmentDelete(req, res, next){
	let id = req.params.id
    await user.updateOne({_id: (await apartment.findOne({_id: id})).userID}, {$pull: {currentApartments: id}});
    await user.updateMany({
    }, {$pull: {savedApartments: id.toString()}}, {multi: true});
}

// Finds all apartments inside user currentApartment array and properly deletes them
async function handleUserDelete(req, res, next){
	let id = req.params.id
    let k = await user.findOne({"_id": id});
    await user.update({
    }, {$pull: {savedApartments: {$in: k.currentApartments}}}, {multi: true});
    k.currentApartments.forEach(async aptID => {
         if (aptID != {}){
            await handleApartmentDelete(aptID);
        }
    });
    await apartment.deleteMany({userID: id});
}

async function returnApt(req, res, next){
    try {
    	let id = req.params.id
        // checks if apartment exists
        let k = await apartment.findOne({'_id': id});
        if (k == null) {
            throw Error;
        }
        // If apartment is found, return
        res.status(200).json({"message" : "OK", "data": k});
    }
    catch {
        res.status(404).json({"message": "Invalid Apartment ID", "data": "Apartment ID not found"});
    }
}

async function putModel(req, res, next){
        try {
            await user.updateOne({_id: (await apartment.findOne({_id: id})).userID}, {$pull: {currentApartments: id}});
            // find and update given apartment (validation run through parameter)
            let k =  apartment.findOneAndUpdate({_id: req.params.id}, {
                LatLong: req.body.LatLong,
                Address: req.body.Address,
                StartDate: req.body.StartDate,
                EndDate: req.body.EndDate,
                Bedrooms: req.body.Bedrooms,
                Bathrooms: req.body.Bathrooms,
                userID: req.body.UserID
                }, { runValidators: true });
            await user.updateOne({_id: k.userID}, {$push: {currentApartments: id}});
            await res.status(201).json({"message" : "User Updated", "data": await apartment.findOne(k)});
        }
        catch {
            res.status(404).json({"message" : "Apartment could not be updated"});
        }
    }

async function deleteApt(req, res, next) {
    try {
    	let id = req.params.id
        // If apartment isn't found
        if (await apartment.find({_id: id}).count() == 0){
            throw Error;
        }
        // If apartment is found, delete
        await handleApartmentDelete(ObjectId(id));
        await apartment.findOneAndDelete({"_id": id});
        res.status(200).json({"message": "OK"});
    }
    catch {
        res.status(404).json({"message": "ID not found", "data": "invalid Apartment ID"})
    }
}

async function queryMongo(req, res, next){
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
       res.status(200).json({"message" : "OK", "data": outApartment});
    }

async function postToModel(req, res, next){
        // Makes new apartment with specifications
        var newApartment = new apartment({
            LatLong: req.body.LatLong,
            Address: req.body.Address,
            StartDate: req.body.StartDate,
            EndDate: req.body.EndDate,
            Bedrooms: req.body.Bedrooms,
            Bathrooms: req.body.Bathrooms,
            userID: req.body.UserID
        })
        
        try {
            // If user ID specified in body is invalid, do not post
            if (await user.find({_id: req.body.UserID}).count() == 0){
                throw Error;
            }
            // Updates all users by deleting the apartment id from their list of current apartments
            await user.updateOne({_id: newApartment.userID}, {$push: {currentApartments: newApartment._id}});
            await newApartment.save();
            res.status(201).json({"message" : "Apartment Created", "data": newApartment});
        }
        catch {
            res.status(400).json({"message" : "Apartment Not Created, invalid parameters"});
        }
    }

module.exports = {
	returnApt: returnApt,
	handleApartmentDelete: handleApartmentDelete,
	handleUserDelete: handleUserDelete,
	putModel: putModel,
	deleteApt: deleteApt,
	queryMongo: queryMongo,
	postToModel: postToModel
};