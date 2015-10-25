var Emoticon = require('../../models/emoticon');
var EmoticonHistory = require('../../models/emoticonhistory');
var Session = require('../../models/session');
var router = require('express').Router();
var db = require('../../db.js');
var websockets = require('../../web_socket/websockets.js');
var cors = require('cors');
var NotiCtrl = require('../../noti.ctrl.js');

// get all the emoticons
router.get('/', cors(), function(req, res, next){
	Emoticon.find()
	.sort('-date')
	.exec(function(err, emos){
		if (err) { return next(err); }
		res.status(200).json(emos);
	});
});

router.post('/findbywatchlocation', cors(), function(req, res, next){
	var watchlocation = JSON.parse(req.body.watchlocation);

	Emoticon.find()
	.exec(function(err, emos){
		if (err) { return next(err); }

		var filtered_emos = [];
		for (var i = 0; i < emos.length; i++)
		{	
			var emo = emos[i];
			var location = JSON.parse(emo.location);
			if (!(location.lat < watchlocation.nw_lat) ||
            !(location.lat > watchlocation.se_lat) ||
            !(location.lon < watchlocation.se_lon) ||
            !(location.lon > watchlocation.nw_lon) )
	        {
	            continue; // skip this post - no need to draw
	        }
	        else
	        {
	        	filtered_emos.push(emo)
	        }
		}
		console.log(filtered_emos);
		res.status(200).json(filtered_emos);
	});
})

// create emoticon
router.post('/', cors(), function(req, res, next){
	var relativeLifeSpan = req.body.lifespan;
	var currentDate      = new Date();
	var currentTimeMilli = currentDate.getTime();
	var relativeLifeEnd  = relativeLifeSpan + currentTimeMilli;

	var emoticon = new Emoticon({
		_id         : req.body._id,
		location 	: req.body.location,
		lifespan 	: relativeLifeSpan,
		lifeend  	: relativeLifeEnd,
		guid     	: req.body.guid,
		type        : req.body.type
	});

	var emoticonhistory = new EmoticonHistory({
		_id         : req.body._id,
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

		// broadcast to all clients about the new emoticon coming in!
		//websockets.broadcast('new_emoticon', emoticon);
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

			var emoticon_location = JSON.parse(emoticon.location);
			for (var i = 0; i < sessions.length; i++)
			{	
				var session = sessions[i];
				var watchloc = JSON.parse(session.watchloc);
				var location = JSON.parse(session.location);

				var isWatching = (emoticon_location.lat < watchloc.nw_lat &&
					emoticon_location.lat > watchloc.se_lat &&
					emoticon_location.lon > watchloc.nw_lon &&
					emoticon_location.lon < watchloc.se_lon);
				var isNearby = getDistanceFromLatLonInKm(
					emoticon_location.lat, 
					emoticon_location.lon, 
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
					if (session.pushid && (session.pushid.length > 6) && (session.guid != emoticon.guid)){
						res_list.push(location);
						pushids.push(session.pushid);
					}*/
					NotiCtrl.getPushids(res_list, pushids, session);
				}
				else if (isNearby) // less than 5 km
				{
					var guid = session.guid;
					var location = session.location;
					filtered_sessions.push(guid);

					/*
					if (session.pushid && (session.pushid.length > 6) && (session.guid != emoticon.guid)){
						res_list.push(location);
						pushids.push(session.pushid);
					}*/
					NotiCtrl.getPushids(res_list, pushids, session);
				}
				else
				{
					continue;
				}
			}

			console.log('emos res list', res_list);
			websockets.broadcastTo(filtered_sessions, 'new_emoticon', emoticon);

			var res_data = {
				emoticon: emoticon,
				res_list : res_list,
				pushids : pushids
			}
			// 201 - The request has been fulfilled and resulted in a new resource being created.
			res.status(201).json(res_data); 
		});

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
	});
});

module.exports = router;
