var Session = require('../../models/session');
var SessionHistory = require('../../models/sessionhistory');
var router = require('express').Router();
var db = require('../../db.js');
var websockets = require('../../web_socket/websockets.js');
var cors = require('cors');

var debug = false;

router.get('/', cors(), function(req, res, next){
	Session.find()
	.sort('-date')
	.exec(function(err, sessions){
		if (err) { return next(err); }
		res.status(200).json(sessions);
	});
});

/* if there is no session - create, if there is, - update */
router.post('/', cors(), function(req, res, next){
	var query = {'guid': req.body.guid};
	var update_session = {
		location 	: req.body.location,
		watchloc 	: req.body.watchloc,
		guid     	: req.body.guid,
		guidtgt  	: req.body.guidtgt,
		pushid      : req.body.pushid,
		userid      : req.body.userid,
	};
	var options = {upsert:true, 'new':true};

	Session.findOneAndUpdate(query, update_session, options, function(err, doc){
	    if (err) res.send(500, { error: err });

	    if (debug) console.log('POST - / for session upsert log :', doc);

	    SessionHistory.findOneAndUpdate(query, update_session, {upsert:true, 'new':true}, function(err, doc){
	    	if (debug) console.log("session history saved");
	    });

	    //websockets.broadcast('new_session', doc);

	    res.status(201).json(doc);
	});
});

// for manual find
router.post('/find', cors(), function(req, res, next){
	//console.log("session remove request for :", req.body.guid);
	var query = { 'guid': req.body.guid };

	if (debug) console.log(req.body);
	if (debug) console.log('requested session for guid:', req.body.guid);

	Session.findOne(query, function(err, session){
		if (err) { 
			console.log('session find error:', err);
			return next(err); 
		}
		
		if (debug) console.log("session found one successfully:", req.body.guid);

		res.status(200).json(session);
	});
});

// for manual remove
router.post('/delete', cors(), function(req, res, next){
	var query = { 'guid': req.body.guid };

	if (debug) console.log("session remove request for :", req.body.guid);

	Session.findOneAndRemove(query, function(err){
		if (err) { 
			if (debug) console.log('session delete error:', err);
			return next(err); 
		}
		
		if (debug) console.log("session removed successfully:", req.body.guid);
		res.status(200);
	});
});

// for updating watch location constantly
router.post('/update_userid', cors(), function(req, res, next){
	var query         = {'guid'   :req.body.guid};
	var newUserId 	  = {'userid' :req.body.userid};
	var options       = {upsert:false};

	Session.findOneAndUpdate(query, newUserId, options, function(err, session){
    	if (err) res.send(500, { error: err });

    	res.status(200).json(session);
	});
});

// for updating watch location constantly
router.post('/update_lastupdate', cors(), function(req, res, next){
	var lastupdate = new Date();

	var query         = {'guid'       :req.body.guid};
	var newLastupdate = {'lastupdate' :lastupdate.getTime()};
	var options       = {upsert:false};

	Session.findOneAndUpdate(query, newLastupdate, options, function(err, session){
    	if (err) res.send(500, { error: err });

    	res.status(200).json(session);
	});
});


// for updating watch location constantly
router.post('/update_onlinestat', cors(), function(req, res, next){
	var query         = {'guid'       :req.body.guid};
	var newOnlinestat = {'onlinestat' :req.body.onlinestat};
	var options       = {upsert:false};

	Session.findOneAndUpdate(query, newOnlinestat, options, function(err, session){
    	if (err) res.send(500, { error: err });

    	// let the front-end app know that we updated user location since its updating POI
    	websockets.broadcast('update_POI', session);

    	res.status(200).json(session);
	});
});

// for updating watch location constantly
router.post('/update_watch_loc', cors(), function(req, res, next){
	var query       = {'guid'    :req.body.guid};
	var newWatchLoc = {'watchloc':req.body.watchloc};
	var options     = {upsert:false};

	Session.findOneAndUpdate(query, newWatchLoc, options, function(err, session){
    	if (err) res.send(500, { error: err });

    	// let the front-end app know that we updated user location
    	//websockets.broadcast('update_POI', session);

    	res.status(200).json(session);
	});
});

// for updating current location constantly
router.post('/update_curr_loc', cors(), function(req, res, next){
	var query       = {'guid'    :req.body.guid};
	var newCurrLoc  = {'location':req.body.currloc};
	var options     = {upsert:false};

	Session.findOneAndUpdate(query, newCurrLoc, options, function(err, session){
    	if (err) res.send(500, { error: err });

    	// let the front-end app know that we updated user location
    	websockets.broadcast('update_users_location', session);

    	res.status(200).json(session);
	});
});

// for updating current location constantly
router.post('/update_blocklist', cors(), function(req, res, next){
	var query       = {'guid'    :req.body.guid};
	var block_id    = req.body.block_id;

	Session.findOne(query, function(err, session){
    	if (err) res.send(500, { error: err });

    	var current_blocklist = JSON.parse(session.blocklist);
    	
    	/* look for duplicates */
    	for (var val in current_blocklist)
    	{
    		if (current_blocklist[val] == block_id)
    		{
    			res.status(200);
    			return; // end process here
    		}
    	}

    	current_blocklist.push(block_id);

    	var updated_blocklist = JSON.stringify(current_blocklist);

    	var updates = {'blocklist': updated_blocklist};

    	Session.findOneAndUpdate(query, updates, function(err, session){
	    	if (err) res.send(500, { error: err });

	    	// send block id to client so they can remove reply or post at the same time
    		websockets.broadcast('block_id', block_id);

	    	res.status(200);
		});
	});
});

// for updating current location constantly
router.post('/clear_blocklist', cors(), function(req, res, next){
	var query       = {'guid'     : req.body.guid};
	var emptylist  	= {'blocklist': "[\"1234\"]"};

	Session.findOneAndUpdate(query, emptylist, function(err, session){
    	if (err) res.send(500, { error: err });

    	// send socket to clear local blocklist on client side
    	websockets.broadcast('clear_blocklist', req.body.guid);

    	res.status(200).json(session);
	});
});

// for updating watch location constantly
router.post('/update_coupling', cors(), function(req, res, next){

	var query      = {'guid'    :req.body.guid};
	var newGuidtgt = {'guidtgt' :req.body.guidtgt};
	var options    = {upsert:false};

	// update guidtgt for the session!
	Session.update(query, newGuidtgt, options, function(err, doc){
    	if (err) res.send(500, { error: err });

    	// return the session data which updated!
    	Session.findOne(query, function(err, session){
    		if (err) res.send(500, { error: err });

    		if (debug) console.log('POST - /update_coupling log :', doc);
			websockets.broadcast('update_guidtgt', session);

    		res.status(200).json(session);
    	});
	});
});

module.exports = router;
