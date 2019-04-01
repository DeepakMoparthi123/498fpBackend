// Get the packages we need
var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    secrets = require('./config/secrets'),
    user = require('./models/user'),
    task = require('./models/task'),
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

// var randomUser = new user({name: "Deepak"});



// Use the body-parser package in our application


var userRoute = router.route('/users');
var taskRoute = router.route('/tasks');
router.get('/tasks/:id', function (req, res) {
    console.log(req.params.id);
    var promise = new Promise((resolve, reject) => {
        resolve(task.findOne({'_id': req.params.id})
    );
     });
     promise.then(function (value) {
         res.status(200).json({"message" : "OK", "data": value});
    }).catch(
        res.status(404).json({"message": "invalid task ID", "data": "task ID not found"})
    );
})
router.put('/tasks/:id', function (req, res) {
    var promise = new Promise((resolve, reject) => {
        console.log(req.params.id);
        if (task.find({"_id": req.params.id}) == null){
            reject();
        }
        resolve(task.findOneAndUpdate({"_id": req.params.id}, {name: req.body.name,
            description: req.body.description,
            deadline: req.body.deadline,
            completed: req.body.completed,
            assignedUser: req.body.assignedUser,
            assignedUserName: req.body.assignedUserName,
            dateCreated: Date.now()})
        );
     });
     promise.then(function (value) {
         res.status(200).json({"message" : "OK", "data": value});
    }).catch(
        res.status(404).json({"message": "Invalid task ID", "data": "task ID not found"})
    );
})
router.delete('/tasks/:id', function (req, res) {
    var promise = new Promise((resolve, reject) => {
        if (task.find({"_id": req.params.id}) == null){
            reject();
        }
        resolve(task.findOneAndDelete({"_id": req.params.id}));
     })
     promise.then(function (value) {
        res.status(200).json({"message": "OK"})
    
    }).catch(
        res.status(404).json({"message": "task ID not found", "data": "invalid ID"})
    );
})


taskRoute.get(function(req, res){
    function checkForNull(query){
        try {
            var output = JSON.parse(query);
            return output;
        }
        catch {
            return null;
        }
    }
    function getNumber(query, defaultVal){
        try {

           if (query == undefined || query == null){
               return defaultVal;
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
    var promise = new Promise((resolve, reject) => {
        if (checkForNull(req.query.count) == true){
            console.log(req.query.limit);
            resolve(task.find(checkForNull(req.query.where))
              .limit(getNumber(req.query.limit, 30))
              .select(checkForNull(req.query.select))
              .skip(getNumber(req.query.skip, 0))
              .sort(checkForNull(req.query.sort)).count()
            );
        }
        else {
            console.log(req.query.count);
            resolve(task.find(checkForNull(req.query.where))
                .limit(getNumber(req.query.limit, 30))
                .select(checkForNull(req.query.select))
                .skip(getNumber(req.query.skip, 0))
                .sort(checkForNull(req.query.sort))
            );
        }
    });
    promise.then(function (value) {
        res.status(200).json({"message" : "OK", "data": value});
   });
}).post(function(req, res){
   console.log(req.body);
   var promise = new Promise((resolve, reject) => {
       console.log(req.body);
       var newTask = new task({
           name: req.body.name,
           description: req.body.description,
           deadline: req.body.deadline,
           completed: req.body.completed,
           assignedUser: req.body.assignedUser,
           assignedUserName: req.body.assignedUserName,
           dateCreated: Date.now()
       })
       newTask.save(function (err) {
           console.log("error");
       })
       resolve(newTask);
   });
   promise.then(function (newTask) {
       res.status(201).json({"message" : "Created", "data": newTask});
  });
});


router.get('/users/:id', function (req, res) {
    console.log(req.params.id);
    var promise = new Promise((resolve, reject) => {
        resolve(user.findOne({'_id': req.params.id})
    );
     });
     promise.then(function (value) {
         res.status(200).json({"message" : "OK", "data": value});
    }).catch(
        res.status(404).json({"message": "Invalid User ID", "data": "User ID not found"})
    );
})
router.put('/users/:id', function (req, res) {
    var promise = new Promise((resolve, reject) => {
        console.log(req.params.id);
        if (user.find({"_id": req.params.id}) == null){
            reject();
        }
        resolve(user.findOneAndUpdate({"_id": req.params.id}, {
            name: req.body.name,
            email: req.body.email,
            pendingTasks: req.body.pendingTasks,
            dateCreated: Date.now()})
        );
     });
     promise.then(function (value) {
         res.status(200).json({"message" : "OK", "data": value});
    }).catch(
        res.status(404).json({"message": "User ID not found", "data": "invalid user ID"})
    );
})
router.delete('/users/:id', function (req, res) {
    var promise = new Promise((resolve, reject) => {
        if (user.find({"_id": req.params.id}) == null){
            reject();
        }
        resolve(user.findOneAndDelete({"_id": req.params.id}));
  
       
     })
     promise.then(function (value) {
            res.status(200).json({"message": "OK"})
    }).catch(
            res.status(404).json({"message": "ID not found", "data": "invalid user ID"})
    );
})
userRoute.get(function(req, res){
     function checkForNull(query){
         try {
             var output = JSON.parse(query);
             return output;
         }
         catch {
             return null;
         }
     }
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
     var promise = new Promise((resolve, reject) => {
        if (checkForNull(req.query.count) == true){
            console.log(req.query.count);
            resolve(user.find(checkForNull(req.query.where))
              .limit(getNumber(req.query.limit))
              .select(checkForNull(req.query.select))
              .skip(getNumber(req.query.skip))
              .sort(checkForNull(req.query.sort)).count()
            );
        }
        else {
            console.log(req.query.count);
            resolve(user.find(checkForNull(req.query.where))
                .limit(getNumber(req.query.limit))
                .select(checkForNull(req.query.select))
                .skip(getNumber(req.query.skip))
                .sort(checkForNull(req.query.sort))
            );
        }
     });
     promise.then(function (value) {
         res.status(200).json({"message" : "OK", "data": value});
    });
}).post(function(req, res){
    console.log(req.body);
    var promise = new Promise((resolve, reject) => {
        console.log(req.body);
        var newUser = new user({
            name: req.body.name,
            email: req.body.email,
            pendingTasks: req.body.pendingTasks,
            dateCreated: Date.now()
        })
        newUser.save(function (err) {
            console.log("error");
        })
        resolve(newUser);
    });
    promise.then(function (newUser) {
        res.status(201).json({"message" : "User Created", "data": newUser});
   });
});


// randomUser.save(function (err, randomUser) {
//     if (err) return console.error(err);
//     console.log("saving");
// })
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
