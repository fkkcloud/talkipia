var express = require('express');
var bodyParser = require('body-parser');
var logger = require('morgan');
var socket = require('./web_socket/websockets');
var favicon = require('serve-favicon');
var cors = require('cors');

var Session = require('./models/session');

var websockets = require('./web_socket/websockets.js');
var Post = require('./models/post');

var request = require('request');

var app = express();

app.use(favicon(__dirname + '/resources/favicon.ico'));
app.use(bodyParser.json());
app.use(logger('dev'));
app.use(cors());

app.use('/', require('./controllers')); // get router from controller's index.js

// server 객체는 http.Server에서 얻는것인다 app.listen() 이 이를 리턴한다는 점
var server = app.listen(process.env.PORT || 5000, function(){
	console.log('Server listening on', server.address().port);
});

socket.connect(server); // web socket server가 된다.

setInterval(function(){
	Post.find()
	.exec(function(err, posts){
		if (err) { return next(err); }

		for (var i = 0; i < posts.length; i++)
		{
			var post = posts[i];
			var currentDate = new Date();
			var currentDateMillSec = currentDate.getTime();
			if (post.lifeend < currentDateMillSec)
			{
				Post.findOneAndRemove({ _id: post._id }, function(err){
					if (err) { return next(err); }
					websockets.broadcast('remove_post', post._id);

					if (post.isPost){
						var content = "Your room is about to be disappear '" + post.body + "'";
						var pushids = [];
						pushids.push(post.pushid);

						var notificationObj = { 
							app_id              : "e1a8e08a-600e-11e5-a4f5-4b146350fa11",
							contents			: {en: content},
					        include_player_ids	: pushids,
					    	data				: {'actiontype' : 0, 
					    							'location'  : JSON.stringify(post.location), 
					    							'postid'    : post._id}
					    };
						request.post(
							'https://onesignal.com/api/v1/notifications', 
							notificationObj);
					}
					
				});
			}
		}
	});
			
}, 4000);
/*
// send session check every 10s for offline and online sessions
setInterval(function() {
	socket.broadcast('session_check', null);

	setTimeout(function(){

		Session.find()
		.exec(function(err, sessions){
			if (err) { return next(err); }
			for (var i = 0; i < sessions.length; i++) {
				var session = sessions[i];

				// get time between 2 date
				var t1 = session.lastupdate;
				var t2 = new Date();
				var dif = t1 - t2.getTime();

				var Seconds_from_T1_to_T2 = dif / 1000;
				var Seconds_Between_Dates = Math.abs(Seconds_from_T1_to_T2);

				if (Seconds_Between_Dates > 15)
				{
					var query         = {'guid'       : session.guid};
					var newOnlinestat = {'onlinestat' : false};
					var options       = {upsert       : false};
					Session.findOneAndUpdate(query, newOnlinestat, options, function(err, session){
				    	if (err) return res.send(500, { error: err });

				    	// let the front-end app know that we updated user location since its updating POI
				    	socket.broadcast('update_POI', session);
					});
				}
			}
		});
		// check every sessions and see if its updated within 15s, if not, make it offline and let all the clients know
	}, 5000);

}, 10000);
*/
