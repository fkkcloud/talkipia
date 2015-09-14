var Room = require('../../models/room');
var router = require('express').Router();
var db = require('../../db.js');
var websockets = require('../../web_socket/websockets.js');
var cors = require('cors');

var debug = true;

router.get('/', cors(), function(req, res, next){
	Room.find()
	.sort('-date')
	.exec(function(err, rooms){
		if (err) { return next(err); }
		res.status(200).json(rooms);
	});
});

// for manual find
router.post('/find', cors(), function(req, res, next){
	var query = { 'postid': req.body.postid };

	if (debug) console.log('requested room for postid:', req.body.postid);

	Room.findOne(query, function(err, room){
		if (err) { 
			if (debug) console.log('room find error:', err);
			return next(err); 
		}
		
		if (debug) console.log("room found one successfully:", req.body.postid);

		res.status(200).json(room);
	});
});

router.get('/feed', cors(), function(req, res, next){
	var perPage = req.query.perpage;
	var page    = req.query.page;

	if (debug) console.log('requested rooms');
	
	/* Post use instead of History for test*/
	Room.find()
	.sort('-date')
    .limit(perPage)
	.skip(perPage * page)  	
	.exec(function(err, rooms) {
		if (err) { 
			console.log('rooms find error:', err);
			return next(err); 
		}
		
		if (debug) console.log("rooms found successfully:", rooms.length);
		
     	res.status(200).json(rooms);
    })
});

/* pagination
	http://localhost:3000/api/rooms/postid?page=page?perpage=perpage
	http://localhost:3000/api/rooms/dsafjkldsa323?page=1?perpage=2
*/
router.get('/:guid', cors(), function(req, res, next){
	var guid    = req.params.guid;
	var perPage = req.query.perpage;
	var page    = req.query.page;

	var query = { 'guid': guid };
	
	if (debug) console.log('requested rooms for guid:', guid);
	
	/* Post use instead of History for test*/
	Room.find(query)
	.sort('-date')
    .limit(perPage)
	.skip(perPage * page)  	
	.exec(function(err, rooms) {
		if (err) { 
			console.log('rooms find error:', err);
			return next(err); 
		}
		
		if (debug) console.log("rooms found successfully:", rooms.length);
		
     	res.status(200).json(rooms);
    })
});

router.post('/', cors(), function(req, res, next){
	var room = new Room({
		postid     	: req.body.postid,
		body    	: req.body.body,
		location 	: req.body.location,
		place       : req.body.place,
		guid     	: req.body.guid,
		islocal  	: req.body.islocal,
		devicetoken : req.body.devicetoken,
		followers   : req.body.followers
	});

	room.save(function(err, room){
		if (err) { return next(err); }

		// broadcast to all clients about the new message coming in!
		websockets.broadcast('new_room', room);

		// 201 - The request has been fulfilled and resulted in a new resource being created.
		res.status(201).json(room); 
	});
});

// for manual remove
router.post('/delete', cors(), function(req, res, next){
	var query = { _id: req.body.postid };

	Room.remove(query, function(err, doc){
		if (err) { return next(err); }

		websockets.broadcast('remove_room', req.body.postid);
		res.status(200);
	});
});

// update like
router.post('/update_like', cors(), function(req, res, next){
	var query       = {'roomid' :req.body.roomid};
	var likestat;

	if (req.body.isAdding)
		likestat = { $inc : { 'view' : 1 } };
	else
		likestat = { $inc : { 'view' : -1 } };

	Room.update(query, likestat, function(err, doc){
    	if (err) return res.send(500, { error: err });

    	Room.find(query, function(err, room){
    		if (err) return res.send(500, { error: err });
    		
    		websockets.broadcast('update_room_like', room);
    		res.status(200).json(room);
    	});

	});
});

// update viewing
router.post('/update_view', cors(), function(req, res, next){
	var query       = {'roomid' :req.body.roomid};
	var viewstat;

	if (req.body.isAdding)
		viewstat = { $inc : { 'view' : 1 } };
	else
		viewstat = { $inc : { 'view' : -1 } };

	Room.update(query, viewstat, function(err, doc){
    	if (err) return res.send(500, { error: err });

    	Room.find(query, function(err, room){
    		if (err) return res.send(500, { error: err });

    		websockets.broadcast('update_room_view', room);
    		res.status(200).json(room);
    	});

	});
});

module.exports = router;
