var Session = require('../../models/session');
var SessionHistory = require('../../models/sessionhistory');
var router = require('express').Router();
var db = require('../../db.js');
var websockets = require('../../web_socket/websockets.js');
var cors = require('cors');

router.get('/', cors(), function(req, res, next){
	Session.find()
	.sort('-date')
	.exec(function(err, sessions){
		if (err) { return next(err); }
		res.json(sessions);
	});
});

router.post('/', cors(), function(req, res, next){
	//console.log('location:', req.body.location);
	//console.log('watchloc:', req.body.watchloc);
	//console.log('guid:   ', req.body.guid);

	/*
	var session = new Session({
		location : req.body.location,
		watchloc : req.body.watchloc,
		guid     : req.body.guid,
		guidtgt  : req.body.guidtgt,
	});

	var serssionhistory = new SessionHistory({
		location : req.body.location,
		watchloc : req.body.watchloc,
		guid     : req.body.guid,
		guidtgt  : req.body.guidtgt,
	});
*/
	var query = {'guid': req.body.guid};
	var update_session = {
		location : req.body.location,
		watchloc : req.body.watchloc,
		guid     : req.body.guid,
		guidtgt  : req.body.guidtgt,
	};
	
	Session.findOneAndUpdate(query, update_session, {upsert:true, 'new':true}, function(err, doc){
	    if (err) return res.send(500, { error: err });

	    console.log('POST - / for session upsert log :', doc);

	    SessionHistory.findOneAndUpdate(query, update_session, {upsert:true, 'new':true}, function(err, doc){
	    	console.log("session history saved");
	    });

	    websockets.broadcast('new_session', doc);

	    res.status(201).json(doc);
	});

	/*
	session.save(function(err, session){
		if (err) { return next(err); }

		serssionhistory.save(function(err, serssionhistory){
			//console.log("session history saved");
		});

		//console.log("session logged");

		// broadcast to all clients about the new message coming in!
		websockets.broadcast('new_session', session);

		// 201 - The request has been fulfilled and resulted in a new resource being created.
		res.status(201).json(session); 
	});
	*/
});

// for manual remove
router.put('/', cors(), function(req, res, next){
	//console.log("session remove request for :", req.body.guid);
	var query = { 'guid': req.body.guid };
	Session.findOneAndRemove(query, function(err){
		if (err) { return next(err); }
		
		console.log("session removed successfully:", req.body.guid);
		res.status(200);
	});
});

// for updating watch location constantly
router.post('/update_session', cors(), function(req, res, next){
	var query       = {'guid':req.body.guid};
	var newWatchLoc = {'watchloc':req.body.watchloc};
	var options     = {upsert:false};

	Session.findOneAndUpdate(query, newWatchLoc, options, function(err, session){
    	if (err) return res.send(500, { error: err });

    	//console.log('POST - /update_session log :', doc);

    	return res.status(201).json(session);
	});
});

// for updating watch location constantly
router.post('/update_coupling', cors(), function(req, res, next){

	var query      = {'guid'    :req.body.guid};
	var newGuidtgt = {'guidtgt' :req.body.guidtgt};
	var options    = {upsert:false};

	// update guidtgt for the session!
	Session.update(query, newGuidtgt, options, function(err, doc){
    	if (err) return res.send(500, { error: err });

    	// return the session data which updated!
    	Session.findOne(query, function(err, session){
    		if (err) return res.send(500, { error: err });

    		console.log('POST - /update_coupling log :', doc);

    		// broadcast to all clients about the new message coming in!
			websockets.broadcast('update_guidtgt', session);

    		return res.status(201).json(session);
    	});
	});
});

module.exports = router;
