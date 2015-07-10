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
	/*
	console.log('body:    ', req.body.body);
	console.log('place:   ', req.body.place);
	console.log('location:', req.body.location);
	console.log('guiid:   ', req.body.guid);
	console.log('lifespan:', req.body.lifespan);
	*/

	var relativeLifeSpan = req.body.lifespan;

	var currentDate = new Date();
	var currentTimeMilli = currentDate.getTime();
	var relativeLifeEnd  = relativeLifeSpan + currentTimeMilli;

	var post = new Post({
		body     : req.body.body,
		place    : req.body.place,
		location : req.body.location,
		lifespan : relativeLifeSpan,
		lifeend  : relativeLifeEnd,
		guid     : req.body.guid,
		guidtgt  : req.body.guidtgt
	});

	var history = new History({
		body     : req.body.body,
		place    : req.body.place,
		location : req.body.location,
		lifespan : relativeLifeSpan,
		lifeend  : relativeLifeEnd,
		guid     : req.body.guid,
		guidtgt  : req.body.guidtgt
	});

	post.save(function(err, post){
		if (err) { return next(err); }

		// save history once post is saved
		history.save(function(err, history){
			//console.log("history saved");
		});

		// broadcast to all clients about the new message coming in!
		websockets.broadcast('new_post', post);

		// post will destryo itself after the lifespan
		// 포스트가 됨과 동시에 자기 스스로 lifespan이 다 되면 사라지는 것을 넣어주 (스스로 지워진다)
		// 확인후 지울 코
		setTimeout( function() {
			Post.findOneAndRemove({ _id: post._id }, function(err){
				if (err) { return next(err); }
				//console.log("post removed successfully");

				// 10초보다 긴 경우의 것만 서버가 계산을 하고 서버가 보내줘서 frontend에서 지우도록 관리해줘야 한다.
				var maxInstantLifeSpan = 10000;
				if (relativeLifeSpan > maxInstantLifeSpan){
					websockets.broadcast('remove_post', post._id);
				}
			});
		},  
		relativeLifeSpan);

		// 201 - The request has been fulfilled and resulted in a new resource being created.
		res.json(201, post); 
	});
});

// for manual remove
router.put('/', function(req, res, next){
	Post.findOneAndRemove({ _id: req.body._id }, function(err){
		if (err) { return next(err); }
		
		//console.log("post removed successfully");
		res.json(200);
	});
});

module.exports = router;
