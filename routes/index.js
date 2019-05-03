var express = require('express'),
    router = express.Router();

var user = require('./user'),
	apartment = require('./apartment');

router.get('/apartments', apartment.getApts);
router.post('/apartments', apartment.createApt);
router.get('/apartments/:id', apartment.getApt);
router.put('/apartments/:id', apartment.updateApt);
router.delete('/apartments/:id', apartment.deleteApt);

router.put('/apartments/:userid/current', apartment.addToCurrentApts);
router.put('/apartments/:userid/saved', apartment.addToSavedApts);
router.delete('/apartments/:userid/saved', apartment.removeFromSavedApts);

router.get('/users', user.getUsers);
router.post('/users', user.createUser);
router.get('/users/:id', user.getUser);
router.put('/users/:id', user.updateUser);
router.delete('/users/:id', user.deleteUser);

module.exports = router;

