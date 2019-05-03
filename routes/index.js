var express = require('express'),
    router = express.Router();

var user = require('./user'),
	apartment = require('./apartment');

router.get('/apartments', apartment.getApts);
router.post('/apartments', apartment.createApt);
router.get('/apartments/:id', apartment.getApt);
router.put('/apartments/:id', apartment.updateApt);
router.delete('/apartments/:id', apartment.deleteApt);
// TODO: userId and apt to add to current apartments

// TODO: userId and apt to add to saved apartments

router.get('/users', user.getUsers);
router.post('/users', user.createUser);
router.get('/users/:id', user.getUser);
router.put('/users/:id', user.updateUser);
router.delete('/users/:id', user.deleteUser);

module.exports = router;

