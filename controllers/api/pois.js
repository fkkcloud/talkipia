var POI = require('../../models/poi');
var Session = require('../../models/session');
var router = require('express').Router();
var db = require('../../db.js');
var websockets = require('../../web_socket/websockets.js');
var cors = require('cors');

var debug = 0;

// get all the emoticons
router.get('/', cors(), function(req, res, next){
	POI.find()
	.sort('-date')
	.exec(function(err, pois){
		if (err) { return next(err); }
		res.status(200).json(pois);
	});
});

router.post('/findbywatchlocation', cors(), function(req, res, next){
	var watchlocation = JSON.parse(req.body.watchlocation);

	POI.find()
	.exec(function(err, pois){
		if (err) { return next(err); }

		var filtered_pois = [];
		for (var i = 0; i < pois.length; i++)
		{	
			var poi = pois[i];
			var location = JSON.parse(poi.location);
			if (!(location.lat < watchlocation.nw_lat) ||
            !(location.lat > watchlocation.se_lat) ||
            !(location.lon < watchlocation.se_lon) ||
            !(location.lon > watchlocation.nw_lon) )
	        {
	            continue; // skip this post - no need to draw
	        }
	        else
	        {
	        	// later, we might need to check online state for each session corresponding to the poi
	        	// and do http://stackoverflow.com/questions/21024411/angular-q-how-to-chain-multiple-promises-within-and-after-a-for-loop
	        	// to get the most correct pois. - need $q.all()
	        	filtered_pois.push(poi)
	        }
		}
		//console.log(filtered_pois);
		res.status(200).json(filtered_pois);
	});
})

router.post('/', cors(), function(req, res, next){
	var query = {'guid': req.body.guid};
	var upsert_poi = {
		location 	: req.body.location,
		guid     	: req.body.guid,
	};
	var options = {upsert:true, 'new':true};

	POI.findOneAndUpdate(query, upsert_poi, options, function(err, poi){
	    if (err) res.send(500, { error: err });

	    if (debug) console.log('POI upsert :', poi);


	    //websockets.broadcast('update_POI', doc);
		var filtered_sessions = [];
		Session.find()
		.exec(function(err, sessions){
			if (err) { return next(err); }

			var poi_location = JSON.parse(poi.location);
			for (var i = 0; i < sessions.length; i++)
			{	
				var session = sessions[i];
				var watchloc = JSON.parse(session.watchloc);

				var isWatching = (poi_location.lat < watchloc.nw_lat &&
					poi_location.lat > watchloc.se_lat &&
					poi_location.lon > watchloc.nw_lon &&
					poi_location.lon < watchloc.se_lon);

				if (isWatching)
				{
					var guid = session.guid;
					filtered_sessions.push(guid);
				}
				else
				{
					continue;
				}
			}

			console.log('poi filtered poi list:', filtered_sessions);
			websockets.broadcastTo(filtered_sessions, 'update_POI', poi);
		});

	    // update session online stat when POI gets updated opens
		var query         = {'guid'       :req.body.guid};
		var newOnlinestat = {'onlinestat' :true};
		var options       = {upsert:false};
		Session.findOneAndUpdate(query, newOnlinestat, options, function(err, session){
	    	if (err) res.send(500, { error: err });
		});

	    res.status(201).json(poi);
	});
});

module.exports = router;
