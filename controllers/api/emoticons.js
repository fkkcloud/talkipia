var Emoticon = require('../../models/emoticon');
var EmoticonHistory = require('../../models/emoticonhistory');
var router = require('express').Router();
var db = require('../../db.js');
var websockets = require('../../web_socket/websockets.js');
var cors = require('cors');

// get all the emoticons
router.get('/', cors(), function(req, res, next){
	Emoticon.find()
	.sort('-date')
	.exec(function(err, emos){
		if (err) { return next(err); }
		res.status(200).json(emos);
	});
});

// create emoticon
router.post('/', cors(), function(req, res, next){
	var relativeLifeSpan = req.body.lifespan;
	var currentDate      = new Date();
	var currentTimeMilli = currentDate.getTime();
	var relativeLifeEnd  = relativeLifeSpan + currentTimeMilli;

	var emoticon = new Emoticon({
		location 	: req.body.location,
		lifespan 	: relativeLifeSpan,
		lifeend  	: relativeLifeEnd,
		guid     	: req.body.guid,
		type        : req.body.type
	});

	var emoticonhistory = new EmoticonHistory({
		location 	: req.body.location,
		lifespan 	: relativeLifeSpan,
		lifeend  	: relativeLifeEnd,
		guid     	: req.body.guid,
		type        : req.body.type
	});

	emoticon.save(function(err, emoticon){
		if (err) { return next(err); }

		// save history once post is saved
		emoticonhistory.save(function(err, emoticonhistory){
			//console.log("history saved");
		});

		// broadcast to all clients about the new message coming in!
		websockets.broadcast('new_emoticon', emoticon);

		// post will destryo itself after the lifespan
		// 포스트가 됨과 동시에 자기 스스로 lifespan이 다 되면 사라지는 것을 넣어주 (스스로 지워진다)
		// 서버가 24시간 항상 돌고 있어야 post들이 알아서 잘 지워진다.
		setTimeout( function() {
			Emoticon.findOneAndRemove({ _id: emoticon._id }, function(err){
				if (err) { return next(err); }

				websockets.broadcast('remove_emoticon', emoticon._id);
			});
		},  
		relativeLifeSpan);

		// 201 - The request has been fulfilled and resulted in a new resource being created.
		res.status(201).json(emoticon); 
	});
});

module.exports = router;
