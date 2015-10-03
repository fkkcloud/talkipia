var Post = require('../../models/post');
var History = require('../../models/history');
var router = require('express').Router();
var db = require('../../db.js');
var websockets = require('../../web_socket/websockets.js');
var cors = require('cors');

// get all the posts
router.get('/', cors(), function(req, res, next){
	Post.find()
	.sort('-date')
	.exec(function(err, posts){
		if (err) { return next(err); }
		res.status(200).json(posts);
	});
});

/* pagination
	http://localhost:3000/api/posts/page?perpage=page
	http://localhost:3000/api/posts/1?perpage=2
*/
router.get('/:page', cors(), function(req, res, next){
	var perPage = req.query.perpage;
	var page    = req.params.page;

	/* Post use instead of History for test*/
	Post.find()
	.sort('-date')
    .limit(perPage)
	.skip(perPage * page)  	
	.exec(function(err, posts) {
     	res.status(200).json(posts);
    })
});

// get pagination - histories
router.get('/history/:page', cors(), function(req, res, next){
	var perPage = req.query.perpage;
	var page    = req.params.page;

	/* Post use instead of History for test*/
	History.find()
	.sort('-date')
    .limit(perPage)
	.skip(perPage * page)  	
	.exec(function(err, posts) {
     	res.status(200).json(posts);
    })
});

// create post
router.post('/', cors(), function(req, res, next){
	var relativeLifeSpan = req.body.lifespan;
	var currentDate      = new Date();
	var currentTimeMilli = currentDate.getTime();
	var relativeLifeEnd  = relativeLifeSpan + currentTimeMilli;

	var post = new Post({
		_id	        : req.body._id,
		body     	: req.body.body,
		place    	: req.body.place,
		location 	: req.body.location,
		lifespan 	: relativeLifeSpan,
		lifeend  	: relativeLifeEnd,
		guid     	: req.body.guid,
		islocal  	: req.body.islocal,
		pushid      : req.body.pushid,
		userid      : req.body.userid,
		userplace   : req.body.userplace,
		isPost      : req.body.isPost
	});

	var history = new History({
		_id	        : req.body._id,
		body     	: req.body.body,
		place    	: req.body.place,
		location 	: req.body.location,
		lifespan 	: relativeLifeSpan,
		lifeend  	: relativeLifeEnd,
		guid     	: req.body.guid,
		islocal  	: req.body.islocal,
		pushid      : req.body.pushid,
		userid      : req.body.userid,
		userplace   : req.body.userplace,
		isPost      : req.body.isPost
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
		// 서버가 24시간 항상 돌고 있어야 post들이 알아서 잘 지워진다.
		setTimeout( function() {
			Post.findOneAndRemove({ _id: post._id }, function(err){
				if (err) { return next(err); }
				//console.log("post removed successfully");

				websockets.broadcast('remove_post', post._id);
			});
		},  
		relativeLifeSpan);

		// 201 - The request has been fulfilled and resulted in a new resource being created.
		res.status(201).json(post); 
	});
});

router.post('/update_guidtgt', cors(), function(req, res, next){
	var query       = {'guid'    :req.body.guid};
	var newGuidtgt  = {'guidtgt' :req.body.guidtgt} ;
	var options     = {multi:true};

	Post.update(query, newGuidtgt, options, function(err, doc){
    	if (err) return res.send(500, { error: err });

    	Post.find(query, function(err, post){
    		if (err) return res.send(500, { error: err });
    		res.status(201).json(post);
    	});
	});
});

// for manual remove
router.post('/delete', cors(), function(req, res, next){
	var query = { _id: req.body._id };

	Post.remove(query, function(err, doc){
		if (err) { return next(err); }	

		websockets.broadcast('remove_post', req.body._id);
		res.status(201);
	});
});

module.exports = router;
