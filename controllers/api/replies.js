var Room = require('../../models/reply');
var router = require('express').Router();
var db = require('../../db.js');
var websockets = require('../../web_socket/websockets.js');
var cors = require('cors');

var debug = true;

// find all replies
router.get('/', cors(), function(req, res, next){
	Reply.find()
	.sort('-date')
	.exec(function(err, replies){
		if (err) { return next(err); }
		res.status(200).json(replies);
	});
});

// find all replies within room id
router.post('/find', cors(), function(req, res, next){
	var query = { 'roomid': req.body.roomid };

	if (debug) console.log('requested replies for roomid:', req.body.roomid);

	Reply.find(query)
	.sort('-date')
	.exec(function(err, replies){
		if (err) { 
			console.log('replies find error:', err);
			return next(err); 
		}
		
		if (debug) console.log("replies found successfully:", req.body.roomid);

		res.status(200).json(replies);
	});
});

/* pagination
	http://localhost:3000/api/replies/page?perpage=page
	http://localhost:3000/api/replies/1?perpage=2
*/
router.get('/:roomid', cors(), function(req, res, next){
	var roomid  = req.params.roomid;
	var perPage = req.query.perpage;
	var page    = req.query.page;

	var query = { 'roomid': roomid };

	if (debug) console.log('requested replies for roomid:', roomid);

	/* Post use instead of History for test*/
	Reply.find(query)
	.sort('-date')
    .limit(perPage)
	.skip(perPage * page)  	
	.exec(function(err, replies) {
		if (err) { 
			console.log('replies find error:', err);
			return next(err); 
		}

		if (debug) console.log("replies found successfully:", req.body.roomid);

     	res.status(200).json(replies);
    })
});

//create
router.post('/', cors(), function(req, res, next){
	var reply = new Reply({
		roomid     	: req.body.roomid,
		body    	: req.body.body,
		location 	: req.body.location,
		guid     	: req.body.guid,
		islocal  	: req.body.islocal,
		devicetoken : req.body.devicetoken,
	});

	reply.save(function(err, replies){
		if (err) { return next(err); }

		// broadcast to all clients about the new message coming in!
		websockets.broadcast('new_reply', replies);

		// 201 - The request has been fulfilled and resulted in a new resource being created.
		res.status(201).json(replies); 
	});
});


// for manual remove
router.post('/delete', cors(), function(req, res, next){
	var query = { _id: req.body._id };

	Reply.remove(query, function(err, doc){
		if (err) { return next(err); }	

		websockets.broadcast('remove_reply', req.body._id);
		res.status(200);
	});
});

// online currently? - writer
router.post('/update_online', cors(), function(req, res, next){
	var query       = {'guid'    :req.body.guid};
	var onlinestat  = {'isOnline' :req.body.isOnline} ;
	var options     = {multi:true};

	Reply.update(query, onlinestat, options, function(err, doc){
    	if (err) return res.send(500, { error: err });

    	websockets.broadcast('updateonline_reply');

    	/*
    	Reply.find(query, function(err, replies){
    		if (err) return res.send(500, { error: err });
    		return res.status(201).json(replies);
    	});
		*/
		res.status(200);
	});
});

module.exports = router;
