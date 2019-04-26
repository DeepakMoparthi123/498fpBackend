var db = require('../db.js');
var apartment = require('../models/apartment.js');
var user = require('../models/user.js');
var helper = require('../helper.js');
var ObjectId = require('mongodb').ObjectID;

async function getUser(req, res, next) {
    try {
    	let id = req.params.id
        let k = await user.findOne({'_id': id});
        // if user not found, throw error
        if (k == null){
            throw Error;
        }
        res.status(200).json({"message" : "OK", "data": k});
    } catch {
        res.status(404).json({"message": "Invalid User ID", "data": "User ID not found"});
    }
}

async function putModel(req, res, next){
        try {
        var newUser = new user({
            _id: req.params.id,
            currentApartments: req.body.currentApartments,
            savedApartments: req.body.savedApartments,
            cellPhone: req.body.cellPhone,
            email: req.body.email,
            name: req.body.name
        });
        // saves current user
        var currentUser = await user.findOne({"_id": newUser.id});
        
        // Necessary to filter out apartments with invalid ID's
         async function filterApartments(apartments){
             async function includeApartment(apartmentID){
                // Filter out if apartment with given ID is not found
                try {
                    let k = await apartment.find({_id: ObjectId(apartmentID)}).count();
                    return (1 == k);
                } catch {
                    return false;
                }
             }
             let output = [];
             for (let index = 0; index < apartments.length; index++){
                if (await includeApartment(apartments[index])){
                    output.push(apartments[index]);
                }
            }
            return output;
        }
        newUser.currentApartments = await filterApartments(newUser.currentApartments);
        newUser.savedApartments = await filterApartments(newUser.savedApartments);
        // Deletes apartments that used to be in old currentapartments list but are no longer in new list
        for (let index = 0; index < currentUser.currentApartments.length; index++){
            let k = currentUser.currentApartments[index].toString();
            if (!await newUser.currentApartments.includes(k)){
                try {
                    await handleApartmentDelete(ObjectId(k));
                    await apartment.deleteOne({_id: k});
                }
                catch{

                }
            }
        }
        for (let index = 0; index < newUser.currentApartments.length; index++){
            let k = newUser.currentApartments[index];
            if ((typeof k) == String) {
                k = ObjectId(k);
            }
            let apt = await apartment.findOne({_id: k});
            await user.findOneAndUpdate({_id: apt.userID}, {$pull: {currentApartments: k}});
            await user.findOneAndUpdate({_id: apt.userID}, {$pull: {currentApartments: ObjectId(k)}});
            await apartment.findOneAndUpdate({_id: k.toString()}, {userID: newUser._id});
        }
        
            await user.findOneAndUpdate({_id: req.params.id}, {
                currentApartments: newUser.currentApartments,
                savedApartments: newUser.savedApartments,
                cellPhone: newUser.cellPhone,
                email: newUser.email,
                name: newUser.name
            });
            res.status(201).json({"message" : "Apartment Updated", "data": newUser});
        }
        catch {
            res.status(404).json({"message" : "Apartment not found"});
        }
        
    }

async function deleteUser(req, res, next) {
    try {
    	let id = req.params.id
        if (await user.find({_id: id}).count() == 0){
            throw Error;
        }
        // Updates/deletes all data that would be affected by deleting user
        await handleUserDelete(id);
        // Delete user
        await user.findOneAndDelete({"_id": id});
        res.status(200).json({"message": "OK"});
    }
    catch {
        res.status(404).json({"message": "ID not found", "data": "invalid user ID"})
    }
}

async function queryMongo(req, res, next){
         // Count parameter
        if (req.query.count == 1){
            var outUser = await user.find(helper.checkForNull(req.query.where)).count();
        }
        else {
            var outUser = await user.find(helper.checkForNull(req.query.where))
                .limit(helper.getNumber(req.query.limit))
                .select(helper.checkForNull(req.query.select))
                .skip(helper.getNumber(req.query.skip))
                .sort(helper.checkForNull(req.query.sort));
        }
        res.status(200).json({"message" : "OK", "data": outUser});
     }

async function postToModel(req, res, next){
        var newUser = await new user({
            _id: req.body._id,
            currentApartments: req.body.currentApartments,
            savedApartments: req.body.savedApartments,
            cellPhone: req.body.cellPhone,
            email: req.body.email,
            name: req.body.name
        })
        // Necessary to filter out apartments in saved/current apartments with invalid ID's
         async function filterApartments(apartments){
             async function includeApartment(apartmentID){
                try {
                // Filter out if not found
                let k = await apartment.find({_id: ObjectId(""+apartmentID)}).count();
                return (1 == k);
                } catch {
                    return false;
                }
             }
            let output = [];
            for (let index = 0; index < apartments.length; index++){
                if (await includeApartment(apartments[index])){
                    output.push(apartments[index]);
                    
                }
            }
            
             return output;
        }
        
        
        newUser.currentApartments = await filterApartments(newUser.currentApartments);
        newUser.savedApartments = await filterApartments(newUser.savedApartments);
        for (let index = 0; index < newUser.currentApartments.length; index++){
            let k = newUser.currentApartments[index];
            if ((typeof k) == String) {
                k = ObjectId(k);
            }
            let apt = await apartment.findOne({_id: k});
            await user.findOneAndUpdate({_id: apt.userID}, {$pull: {currentApartments: k}});
            await user.findOneAndUpdate({_id: apt.userID}, {$pull: {currentApartments: ObjectId(k)}});
            await apartment.findOneAndUpdate({_id: k.toString()}, {userID: newUser._id});
        }
        try {
            await newUser.save();
            await res.status(201).json({"message" : "User Created", "data": newUser});
        }
        catch {
            await res.status(404).json({"message" : "Invalid parameters"});
        }
        
    }

module.exports = {
	getUser: getUser,
	putModel: putModel,
	deleteUser: deleteUser,
	queryMongo: queryMongo,
	postToModel: postToModel
};