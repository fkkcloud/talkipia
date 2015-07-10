var Session = require('../../models/session');
var SessionHistory = require('../../models/sessionhistory');
var router = require('express').Router();
var db = require('../../db.js');
var websockets = require('../../web_socket/websockets.js');

router.get('/', function(req, res, next){
	Session.find()
	.sort('-date')
	.exec(function(err, sessions){
		if (err) { return next(err); }
		res.json(sessions);
	});
});

router.post('/', function(req, res, next){
	console.log('location:', req.body.location);
	console.log('watchloc:', req.body.watchloc);
	console.log('guiid:   ', req.body.guid);

	var session = new Session({
		location : req.body.location,
		watchloc : req.body.watchloc,
		guid     : req.body.guid,
	});

	var serssionhistory = new SessionHistory({
		location : req.body.location,
		watchloc : req.body.watchloc,
		guid     : req.body.guid,
	});

	session.save(function(err, session){
		if (err) { return next(err); }

		serssionhistory.save(function(err, serssionhistory){
			console.log("session history saved");
		});

		console.log("session logged");

		// broadcast to all clients about the new message coming in!
		websockets.broadcast('new_session', session);

		// 201 - The request has been fulfilled and resulted in a new resource being created.
		res.json(201, session); 
	});
});

// for manual remove
router.put('/', function(req, res, next){
	console.log("session remove request for :", req.body.guid);
	var query = { 'guid': req.body.guid };
	Session.findOneAndRemove(query, function(err){
		if (err) { return next(err); }
		
		console.log("session removed successfully");
		res.sendStatus(200);
	});
});

// for updating watch location constantly
router.post('/update', function(req, res, next){
	var query = {'guid':req.body.guid};
	var newWatchLoc = {'watchloc':req.body.watchloc};
	var options = {upsert:false};

	Session.findOneAndUpdate(query, newWatchLoc, options, function(err, doc){
    	if (err) return res.send(500, { error: err });

    	console.log('updated session:', doc);

    	return res.json(201, doc);
	});
});

module.exports = router;
