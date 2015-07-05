var Post = require('../../models/post');
var History = require('../../models/history');
var router = require('express').Router();
var db = require('../../db.js');
var websockets = require('../../web_socket/websockets.js');

router.get('/', function(req, res, next){
	Post.find()
	.sort('-date')
	.exec(function(err, posts){
		if (err) { return next(err); }
		res.json(posts);
	});
});

router.post('/', function(req, res, next){
	console.log('body:    ', req.body.body);
	console.log('place:   ', req.body.place);
	console.log('location:', req.body.location);
	console.log('guiid:   ', req.body.guid);

	function map_range(value, low1, high1, low2, high2) {
	    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
	}

	var charLen = req.body.body.length;

	var relativeLifeSpan;
	if (charLen < 5)
	{
		relativeLifeSpan = 3000;
	}
	else
	{
		relativeLifeSpan = charLen * map_range(charLen, 5, 20, 500, 300);
	}

	var currentDate = new Date();
	var currentTimeMilli = currentDate.getTime();
	var relativeLifeEnd  = relativeLifeSpan + currentTimeMilli;

	var post = new Post({
		body     : req.body.body,
		place    : req.body.place,
		location : req.body.location,
		lifespan : relativeLifeSpan,
		lifeend  : relativeLifeEnd,
		guid     : req.body.guid
	});

	var history = new History({
		body     : req.body.body,
		place    : req.body.place,
		location : req.body.location,
		lifespan : relativeLifeSpan,
		lifeend  : relativeLifeEnd,
		guid     : req.body.guid
	});

	post.save(function(err, post){
		if (err) { return next(err); }

		// save history once post is saved
		history.save(function(err, history){
			console.log("history saved");
		});

		// broadcast to all clients about the new message coming in!
		websockets.broadcast('new_post', post);

		// post will destryo itself after the lifespan
		// 포스트가 됨과 동시에 자기 스스로 lifespan이 다 되면 사라지는 것을 넣어주 (스스로 지워진다)
		// 확인후 지울 코
		setTimeout( function() {
			Post.findOneAndRemove({ _id: post._id }, function(err){
				if (err) { return next(err); }
				console.log("post removed successfully");
			});
		},  
		relativeLifeSpan );

		// 201 - The request has been fulfilled and resulted in a new resource being created.
		res.json(201, post); 
	});
});

// for manual remove
router.put('/', function(req, res, next){
	Post.findOneAndRemove({ _id: req.body._id }, function(err){
		if (err) { return next(err); }
		
		console.log("post removed successfully");
		res.json(200);
	});
});

module.exports = router;
