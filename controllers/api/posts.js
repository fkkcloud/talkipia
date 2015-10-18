var Post = require('../../models/post');
var History = require('../../models/history');
var Session = require('../../models/session');
var router = require('express').Router();
var db = require('../../db.js');
var websockets = require('../../web_socket/websockets.js');
var cors = require('cors');

// get all the posts
router.get('/', cors(), function(req, res, next){
	Post.find()
	//.sort('-date')
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
	//.sort('-date')
    .limit(perPage)
	.skip(perPage * page)  	
	.exec(function(err, posts) {
     	res.status(200).json(posts);
    })
});

router.post('/findbywatchlocation', cors(), function(req, res, next){
	var watchlocation = JSON.parse(req.body.watchlocation);

	Post.find()
	.exec(function(err, posts){
		if (err) { return next(err); }

		var filtered_posts = [];
		for (var i = 0; i < posts.length; i++)
		{	
			var post = posts[i];
			var location = JSON.parse(post.location);
			if (!(location.lat < watchlocation.nw_lat) ||
            !(location.lat > watchlocation.se_lat) ||
            !(location.lon < watchlocation.se_lon) ||
            !(location.lon > watchlocation.nw_lon) )
	        {
	            continue; // skip this post - no need to draw
	        }
	        else
	        {
	        	filtered_posts.push(post)
	        }
		}
		console.log(filtered_posts);
		res.status(200).json(filtered_posts);
	});
})

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
		//websockets.broadcast('new_post', post);
		function deg2rad(deg) {
		    return deg * (Math.PI/180);
		  };
		function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
		    var R = 6371;
		    var dLat = deg2rad(lat2-lat1);
		    var dLon = deg2rad(lon2-lon1); 
		    var a = 
		      Math.sin(dLat/2) * Math.sin(dLat/2) +
		      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
		      Math.sin(dLon/2) * Math.sin(dLon/2)
		      ; 
		    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
		    var d = R * c;
		    return d;
		};

		var res_list = [];
		var filtered_sessions = [];
		Session.find()
		.exec(function(err, sessions){
			if (err) { return next(err); }

			var post_location = JSON.parse(post.location);
			console.log("post_location", post_location);
			for (var i = 0; i < sessions.length; i++)
			{	
				var session = sessions[i];
				var watchloc = JSON.parse(session.watchloc);
				var location = JSON.parse(session.location);

				var isWatching = (post_location.lat < watchloc.nw_lat &&
					post_location.lat > watchloc.se_lat &&
					post_location.lon > watchloc.nw_lon &&
					post_location.lon < watchloc.se_lon));
				var isNearby = getDistanceFromLatLonInKm(
					post_location.lat, 
					post_location.lon, 
					location.lat,
					location.lon)
					< 5;

				if (isWatching)
				{
					var guid = session.guid;
					var location = {
						lat : watchloc.center_lat,
						lon : watchloc.center_lon
					};
					filtered_sessions.push(guid);
					res_list.push(location);
				}
				else if (isNearby) // less than 5 km
				{
					var guid = session.guid;
					var location = session.location;
					filtered_sessions.push(guid);
					res_list.push(location);
				}
				else
				{
					continue;
				}
			}

			console.log('flitered sessions', filtered_sessions);
			websockets.broadcastTo(filtered_sessions);
		});
		

		// post will destryo itself after the lifespan
		// 포스트가 됨과 동시에 자기 스스로 lifespan이 다 되면 사라지는 것을 넣어주 (스스로 지워진다)
		// 서버가 24시간 항상 돌고 있어야 post들이 알아서 잘 지워진다.
		if (!post.isPost){ // 방은 길어서 이 프로세스로 지원하지 않고, 메세지만 이걸로 지원!
			setTimeout( function() {
				Post.findOneAndRemove({ _id: post._id }, function(err){
					if (err) { return next(err); }
					//console.log("post removed successfully");
					//https://onesignal.com/api/v1/notifications // 노티보내주
					websockets.broadcast('remove_post', post._id);
				});
			},  
			relativeLifeSpan);
		}
		
		var res_data = {
			post: post,
			res_list : res_list
		}
		// 201 - The request has been fulfilled and resulted in a new resource being created.
		res.status(201).json(res_data); 
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
