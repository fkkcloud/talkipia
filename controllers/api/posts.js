var Post = require('../../models/post');
var History = require('../../models/history');
var Session = require('../../models/session');
var router = require('express').Router();
var db = require('../../db.js');
var websockets = require('../../web_socket/websockets.js');
var cors = require('cors');
var NotiCtrl = require('../../noti.ctrl.js');

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

/* pagination with coords
	http://localhost:3000/api/posts/page?perpage=page
	http://localhost:3000/api/posts/1?perpage=2
*/
router.get('/findbycoords/:page', cors(), function(req, res, next){
	var perPage = req.query.perpage;
	var page    = req.params.page;
	var location =  JSON.parse(req.query.location);

	var query = {
	  $near : {
	    $geometry : {
	      type : "Point",
	      coordinates : [location.lat, location.lot] 
	    },
	    $maxDistance : 50
	  }
	}

	/* Post use instead of History for test*/
	Post.find(query)
	//.sort('-date')
    .limit(perPage)
	.skip(perPage * page)  	
	.exec(function(err, posts) {
     	res.status(200).json(posts);
    })
});

/* only find by watchlocation do clusterer */
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
		

		// clustering logic
		if (filtered_posts.length < 11){ // no need to cluster
			//console.log(filtered_posts);
			var data = {'posts':filtered_posts, 'type':0};
			res.status(200).json(data);
		}
		else 
		{
			var clustered_posts = [];
			var height = watchlocation.nw_lat - watchlocation.se_lat;
			var width = watchlocation.se_lon - watchlocation.nw_lon;
			var height_margin = height * 0.2;
			var width_margin  = width * 0.333;
			var sections = [];

			// create section bounds
			for (var i = 0; i < sections.length; i++){
				for (var j = 0; j < 5; j++){ // for lat, height - 5 times
					for (var k = 0; k < 3; k++){ // for lon, width - 3 times
						var section = {
							'nw_lat':watchlocation.nw_lat + height_margin * j,
							'nw_lon':watchlocation.nw_lon + width_margin * k,
							'se_lat':watchlocation.se_lat + height_margin * j,
							'se_lon':watchlocation.se_lon + width_margin * k
						}
						sections.push(section);
					}
				}
			}

			for (var i = 0; i < sections.length; i++){
				var section = sections[i];
				var section_posts = [];

				// collect posts within each section
				for (var j = 0; j < filtered_posts.length; j++){
					var post = filtered_posts[j];
					var location = JSON.parse(post.location);
					if (!(location.lat < section.nw_lat) ||
		            !(location.lat > section.se_lat) ||
		            !(location.lon < section.se_lon) ||
		            !(location.lon > section.nw_lon) )
			        {
			            continue; // skip this post - not exist in section 1
			        }
			        else
			        {
			        	section_posts.push(post)
			        }
				}

				// if the section don't have any posts skip it
				if (section_posts.length == 0)
					continue;

				// if the section has posts, cluster it. get avg location per section,
				var sum_lat = 0;
				var sum_lon = 0;
				var section_len = section_posts.length;
				for (var j = 0; j < section_len; j++){
					var post = section_posts[j];
					var location = JSON.parse(post.location);
					sum_lat += location.lat;
					sum_lon += location.lon;
				}
				var avg_lat = sum_lat / section_len;
				var avg_lon = sum_lon / section_len;
				var avg_coords = {'lat':avg_lat, 'lon':avg_lon};
				var age_coords_str = JSON.stringify(avg_coords);
				var clusterer = {'location': avg_coords_str, 'len': section_len};
				clustered_posts.push(clusterer);
			}

			var data = {'posts':clustered_posts, 'type':1};
			console.log('clustered_section:', data);
			res.status(200).json(data);
 		}
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
		isPost      : req.body.isPost,
		geometry    : req.body.geometry
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
		var pushids = [];
		Session.find()
		.exec(function(err, sessions){
			if (err) { return next(err); }

			var post_location = JSON.parse(post.location);
			for (var i = 0; i < sessions.length; i++)
			{	
				var session = sessions[i];
				var watchloc = JSON.parse(session.watchloc);
				var location = JSON.parse(session.location);

				var isWatching = (post_location.lat < watchloc.nw_lat &&
					post_location.lat > watchloc.se_lat &&
					post_location.lon > watchloc.nw_lon &&
					post_location.lon < watchloc.se_lon);
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

					/*
					if (session.pushid && (session.pushid.length > 6) && (session.guid != post.guid)){
						res_list.push(location);
						pushids.push(session.pushid);
					}*/
					NotiCtrl.getPushids(res_list, pushids, session, post, location);
				}
				else if (isNearby) // less than 5 km
				{
					var guid = session.guid;
					var location = session.location;
					filtered_sessions.push(guid);

					/*
					if (session.pushid && (session.pushid.length > 6) && (session.guid != post.guid)){
						res_list.push(location);
						pushids.push(session.pushid);
					}
					*/
					NotiCtrl.getPushids(res_list, pushids, session, post, location);
				}
				else
				{
					continue;
				}
			}

			console.log('posts pushids', pushids);
			websockets.broadcastTo(filtered_sessions, 'new_post', post);

			var res_data = {
				post: post,
				res_list : res_list,
				pushids : pushids
			}
			// 201 - The request has been fulfilled and resulted in a new resource being created.
			res.status(201).json(res_data); 
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
