var express = require('express'),
    router = express.Router();

var user = require('./user'),
	apartment = require('./apartment');

router.get('/apartments', apartment.queryMongo);
router.post('/apartments', apartment.postToModel);
router.get('/apartments/:id', apartment.returnApt);
router.put('/apartments/:id', apartment.putModel);
router.delete('/apartments/:id', apartment.deleteApt);

router.get('/users', user.queryMongo);
router.post('/users', user.postToModel);
router.get('/users/:id', user.getUser);
router.put('/users/:id', user.putModel);
router.delete('/users/:id', user.deleteUser);

module.exports = router;

