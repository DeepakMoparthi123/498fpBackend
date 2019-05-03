var db = require('../db.js');
var apartment = require('../models/apartment.js');
var user = require('../models/user.js');
var helper = require('../helper.js');
var ObjectId = require('mongodb').ObjectID;
var apt = require('./apartment.js');

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

async function updateUser(req, res, next) {
    try {
        var newUser = new user({
            _id: req.params.id,
            CurrentApartments: req.body.CurrentApartments,
            SavedApartments: req.body.SavedApartments,
            CellPhone: req.body.CellPhone,
            Email: req.body.Email,
            Name: req.body.Name,
            ImageURL: req.body.ImageURL
        });
        // saves current user
        var currentUser = await user.findOne({"_id": newUser._id});
        console.log(currentUser)
        
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
            for (let index = 0; index < apartments.length; index++) {
                if (await includeApartment(apartments[index])) {
                    output.push(apartments[index]);
                }
            }
            return output;
        }
        newUser.CurrentApartments = await filterApartments(newUser.CurrentApartments);
        newUser.SavedApartments = await filterApartments(newUser.SavedApartments);
        // Deletes apartments that used to be in old currentapartments list but are no longer in new list
        for (let index = 0; index < currentUser.CurrentApartments.length; index++ ){
            let k = currentUser.CurrentApartments[index].toString();
            if (!await newUser.CurrentApartments.includes(k)){
                try {
                    await apt.handleApartmentDelete(ObjectId(k));
                    await apartment.deleteOne({_id: k});
                }
                catch{

                }
            }
        }
        for (let index = 0; index < newUser.CurrentApartments.length; index++){
            let k = newUser.CurrentApartments[index];
            if ((typeof k) == String) {
                k = ObjectId(k);
            }
            let apt = await apartment.findOne({_id: k});
            await user.findOneAndUpdate({_id: apt.UserID}, {$pull: {CurrentApartments: k}});
            await user.findOneAndUpdate({_id: apt.UserID}, {$pull: {CurrentApartments: ObjectId(k)}});
            await apartment.findOneAndUpdate({_id: k.toString()}, { UserID: newUser._id});
        }
        
            await user.findOneAndUpdate({ _id: req.params.id }, {
                CurrentApartments: newUser.CurrentApartments,
                SavedApartments: newUser.SavedApartments,
                CellPhone: newUser.CellPhone,
                Email: newUser.Email,
                Name: newUser.Name,
                ImageURL: newUser.ImageURL
            });
            
            res.status(201).json({"message" : "User Updated", "data": newUser});
    } catch (err) {
        res.status(404).json({"message" : "User not found", data: err});
    }
}

// OK.
async function deleteUser(req, res, next) {
    try {
    	let id = req.params.id
        let userCount = await user.find({"_id": id}).countDocuments()
        if (userCount === 0) {
            throw Error;
        }
        // Updates/deletes all data that would be affected by deleting user
        await apt.handleUserDelete(id);
        // Delete user
        await user.findOneAndDelete({ "_id": id});
        res.status(200).json({"message": "User deleted"});
    } catch (err) {
        res.status(404).json({ "message": "User not found", "data": err })
    }
}

// OK. 
async function getUsers(req, res, next){
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

async function createUser(req, res, next){
        var newUser = await new user({
            _id: req.body.UserID,
            CurrentApartments: [],
            SavedApartments: [],
            CellPhone: req.body.CellPhone,
            Email: req.body.Email,
            Name: req.body.Name,
            ImageURL: req.body.ImageURL
        })
        // Necessary to filter out apartments in saved/current apartments with invalid ID's
         async function filterApartments(apartments){
             async function includeApartment(apartmentID){
                try {
                // Filter out if not found
                let k = await apartment.find({_id: ObjectId("" + apartmentID)}).count();
                return (k == 1);
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
        
        
        newUser.CurrentApartments = await filterApartments(newUser.CurrentApartments);
        newUser.SavedApartments = await filterApartments(newUser.SavedApartments);
        for (let index = 0; index < newUser.CurrentApartments.length; index++ ){
            let k = newUser.CurrentApartments[index];
            if ((typeof k) == String) {
                k = ObjectId(k);
            }
            let apt = await apartment.findOne({ _id: k });
            await user.findOneAndUpdate({_id: apt.UserID}, { $pull: { CurrentApartments: k}});
            await user.findOneAndUpdate({_id: apt.UserID}, { $pull: { CurrentApartments: ObjectId(k)}});
            await apartment.findOneAndUpdate({ _id: k.toString()}, { UserID: newUser._id});
        }
        try {
            await newUser.save();
            await res.status(201).json({"message" : "User Created", "data": newUser});
        }
        catch (err) {
            await res.status(404).json({"message" : "Invalid parameters", data: err});
        }
        
    }

module.exports = {
	getUser: getUser,
	updateUser: updateUser,
	deleteUser: deleteUser,
	getUsers: getUsers,
	createUser: createUser
};