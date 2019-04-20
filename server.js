// Get the packages we need
var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    secrets = require('./config/secrets'),
    user = require('./models/user'),
    apartment = require('./models/apartment'),
    ObjectId = require('mongodb').ObjectID;
    bodyParser = require('body-parser');

// Create our Express application
var app = express();
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use('/api', router);
// Use environment defined port or 4000
var port = process.env.PORT || 4000;

// Connect to a MongoDB
mongoose.connect(secrets.mongo_connection,  { useNewUrlParser: true });

// Use the body-parser package in our application
var userRoute = router.route('/users');
var apartmentRoute = router.route('/apartments');

// Removes apartment id from current and saved arrays of users
async function handleApartmentDelete(id){
    await user.updateOne({_id: (await apartment.findOne({_id: id})).userID}, {$pull: {currentApartments: id}});
    await user.updateMany({
    }, {$pull: {savedApartments: id.toString()}}, {multi: true});
}

// Finds all apartments inside user currentApartment array and properly deletes them
async function handleUserDelete(id){
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




router.get('/apartments/:id', function (req, res) {
    async function returnApt(id){
        try {
            // checks if apartment exists
            let k = await apartment.findOne({'_id': id});
            if (k == null){
                throw Error;
            }
            // If apartment is found, return
            res.status(200).json({"message" : "OK", "data": k});
        }
        catch {
            res.status(404).json({"message": "Invalid Apartment ID", "data": "Apartment ID not found"});
        }
    }
    returnApt(req.params.id);
})

router.put('/apartments/:id', function (req, res) {
    async function putModel(req){
        try {
            // find and update given apartment (validation run through parameter)
            await apartment.findOneAndUpdate({_id: req.params.id}, {
                LatLong: req.body.LatLong,
                Address: req.body.Address,
                StartDate: req.body.StartDate,
                EndDate: req.body.EndDate,
                Bedrooms: req.body.Bedrooms,
                Bathrooms: req.body.Bathrooms,
                userID: req.body.UserID
                }, { runValidators: true });
            await res.status(201).json({"message" : "User Updated", "data": await apartment.findOne({_id: req.params.id})});
        }
        catch {
            res.status(404).json({"message" : "User could not be updated"});
        }
    }
    putModel(req);
})

router.delete('/apartments/:id', function (req, res) {
    async function deleteApt(id) {
        try {
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
    deleteApt(req.params.id);
})

apartmentRoute.get(function(req, res){
    // Necessary to parse JSON
    function checkForNull(query){
        try {
            var output = JSON.parse(query);
            return output;
        }
        catch {
            return null;
        }
    }
    // Necessary to parse JSON
    function getNumber(query){
        try {
           if (query == null){
               return 0;
           }
           var output = parseInt(query);
           
           if (output < 0){
               return 0;
           }
           return output;
        }
        catch {
            return 0;
        }
    }

    async function queryMongo(req){
        // Count parameter
       if (req.query.count == 1){
           var outApartment = await apartment.find(checkForNull(req.query.where)).count();
       }
       else {
           var outApartment = await apartment.find(checkForNull(req.query.where))
               .limit(getNumber(req.query.limit))
               .select(checkForNull(req.query.select))
               .skip(getNumber(req.query.skip))
               .sort(checkForNull(req.query.sort));
       }
       res.status(200).json({"message" : "OK", "data": outApartment});
    }
    queryMongo(req);
}).post(function(req, res){
    async function postToModel(req){
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
            await user.updateOne({_id: newApartment.userID}, {$push: {currentApartments: newApartment._id}});
            await newApartment.save();
            res.status(201).json({"message" : "Apartment Created", "data": newApartment});
        }
        catch {
            res.status(400).json({"message" : "Apartment Not Created, invalid parameters"});
        }
    }
    postToModel(req);
});


router.get('/users/:id', function (req, res) {
    async function returnUser(id){
        try {
            let k = await user.findOne({'_id': id});
            // if user not found, throw error
            if (k == null){
                throw Error;
            }
            res.status(200).json({"message" : "OK", "data": k});
        }
        catch {
            res.status(404).json({"message": "Invalid User ID", "data": "User ID not found"});
        }
    }
    returnUser(req.params.id);
})
router.put('/users/:id', function (req, res) {
    async function putModel(req){
        var newUser = new user({
            _id: req.params.id,
            currentApartments: req.body.currentApartments,
            savedApartments: req.body.savedApartments,
            cellPhone: req.body.cellPhone,
            email: req.body.email,
            name: req.body.name
        });
        var currentUser = await user.findOne({"_id": newUser.id});
        
        // Necessary to filter out apartments with invalid ID's
         async function filterApartments(apartments){
             async function includeApartment(apartmentID){
                // Filter out if apartment with given ID is not found
                try {
                    let k = await apartment.find({_id: ObjectId(apartmentID)}).count();
                    return 1 == k;
                } catch {
                    return false;
                }
             }
            apartments = await apartments.filter( async apartmentID => { 
                    try {
                        await includeApartment(apartmentID)}
                    catch {
                        return false;
                    }
                }
            )
            return apartments;
        }
        newUser.currentApartments = filterApartments(newUser.currentApartments);
        newUser.savedApartments = filterApartments(newUser.savedApartments);
        currentUser.currentApartments.forEach(async apartmentID => {
                if (!newUser.currentApartments.includes(apartmentID)){
                    try {
                        await handleApartmentDelete(ObjectId(apartmentID));
                        await apartment.deleteOne({_id: ObjectId(apartmentID)});
                    }
                    catch {

                    }
                }
            }   
        )
        try {
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
    putModel(req);
})
router.delete('/users/:id', function (req, res) {
    async function deleteUser(id) {
        try {
            if (await user.find({_id: id}).count() == 0){
                throw Error;
            }
            await handleUserDelete(id);
            await user.findOneAndDelete({"_id": id});
            res.status(200).json({"message": "OK"});
        }
        catch {
            res.status(404).json({"message": "ID not found", "data": "invalid user ID"})
        }
    }
    deleteUser(req.params.id);
})
userRoute.get(function(req, res){
    // JSON processing
     function checkForNull(query){
         try {
             var output = JSON.parse(query);
             return output;
         }
         catch {
             return null;
         }
     }
     // JSON processing
     function getNumber(query){
         try {
            if (query == null){
                return 0;
            }
            var output = parseInt(query);
            
            if (output < 0){
                return 0;
            }
            return output;
         }
         catch {
             return 0;
         }
     }
     async function queryMongo(req){
         // Count parameter
        if (req.query.count == 1){
            var outUser = await user.find(checkForNull(req.query.where)).count();
        }
        else {
            var outUser = await user.find(checkForNull(req.query.where))
                .limit(getNumber(req.query.limit))
                .select(checkForNull(req.query.select))
                .skip(getNumber(req.query.skip))
                .sort(checkForNull(req.query.sort));
        }
        res.status(200).json({"message" : "OK", "data": outUser});
     }
    queryMongo(req);
}).post(function(req, res){
    async function postToModel(req){
        var newUser = new user({
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
                 // Valid autogenerated ID must be 12 bytes long
                try{
                // Filter out if not found
                let k = await apartment.find({_id: ObjectId(apartmentID)}).count();
                    return 1 == k;
                } catch {

                }
             }
             apartments = await apartments.filter(async  apartmentID => { 
                    try {
                       await includeApartment(apartmentID)}
                    catch {
                        return false;
                    }
                }
            )
            return apartments;
        }
        newUser.currentApartments = filterApartments(newUser.currentApartments);
        newUser.savedApartments = filterApartments(newUser.savedApartments);
        try {
            await newUser.save();
            res.status(201).json({"message" : "User Created", "data": newUser});
        }
        catch {
            res.status(404).json({"message" : "Invalid parameters"});
        }
        
    }
    postToModel(req);
});


// Allow CORS so that backend and frontend could be put on different servers
var allowCrossDomain = function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE, OPTIONS");
    next();
};
app.use(allowCrossDomain);

// Use routes as a module (see index.js)
require('./routes')(app, router);

// Start the server
app.listen(port);
console.log('Server running on port ' + port);
