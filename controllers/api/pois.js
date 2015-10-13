var POI = require('../../models/poi');
var router = require('express').Router();
var db = require('../../db.js');
var websockets = require('../../web_socket/websockets.js');
var cors = require('cors');

// get all the emoticons
router.get('/', cors(), function(req, res, next){
	POI.find()
	.sort('-date')
	.exec(function(err, pois){
		if (err) { return next(err); }
		res.status(200).json(pois);
	});
});

router.post('/', cors(), function(req, res, next){
	var query = {'guid': req.body.guid};
	var upsert_poi = {
		location 	: req.body.location,
		guid     	: req.body.guid,
	};
	var options = {upsert:true, 'new':true};

	POI.findOneAndUpdate(query, upsert_poi, options, function(err, doc){
	    if (err) res.send(500, { error: err });

	    if (debug) console.log('POI upsert :', doc);

	    websockets.broadcast('update_POI', doc);

	    res.status(201).json(doc);
	});
});

module.exports = router;
