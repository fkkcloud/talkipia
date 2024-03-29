var _ = require('lodash');
var ws = require('ws');

var Session = require('../models/session');


/* ----------------------- OLD SOCKET MANAGEMENT --------------------------*/
var clients = []; // ws array

exports.getClients = function(){
	return clients;
};

exports.broadcast = function(type, data){
	var json = JSON.stringify({type: type, data: data});

	// 각각의 선택된 클라이언트에게 json을 보낸다.
	clients.forEach(function(client){
		client.send(json)
	});
};


/* ----------------------- NEW SOCKET MANAGEMENT --------------------------*/
var clients_table = {}; // ws hash table with guid {'guid':ws}

exports.getClient = function(guid){
	return clients_table[guid];
}

/* 
	@ guid_list 
	expect guid_list as array of guid strings 
	e.g. ["8520c626-1ebd-5e6e-1657-c6bf39d7c4de", "8520c626-1ebd-5e6e-1657-c6bf39d7c4de", "8520c626-1ebd-5e6e-1657-c6bf39d7c4de", ...]

	@ data
	expect data that will be send to client
*/
exports.broadcastTo = function(guid_list, type, data){
	var json = JSON.stringify({type: type, data: data});

	guid_list.forEach(function(guid){
		var client_socket = clients_table[guid];
		if (client_socket){
			try {
				client_socket.send(json)
				console.log('sent socket msg to ', guid);	
			}
			catch(err) {
				console.log('catch:', err);
			}
		}
	});
}


/* -----------------------  SOCKET CONNECT  --------------------------*/
exports.connect = function(server){
	var wss = new ws.Server({server: server});

	// 클라이언트가 서버소켓에 연결되었을때, client배열에 클라이언트의 웹소켓을 저장하여
	// 항상 트랙킹할수 있도록 한다.
	wss.on('connection', function(ws){ 
		console.log('new client connected.');

		// for old socket array
		clients.push(ws);
		
		exports.broadcast('server said - new client connected.'); // 클라이언트가 서버의 웹소켓에 접속할때 broadcast

		/* this is for saving ws to corresponding guid */
		ws.on('message', function incoming(message){
			//console.log('received message: %s', message);

			/* -----------------------  RECEIVING GUID from client  --------------------------*/
			try {
			    var received_package = JSON.parse(message);

				//console.log(received_package);

				if (received_package.payload_type == '101386')
				{
					var guid = received_package.guid;
					clients_table[guid] = ws;

					// update session online stat when socket opens
					var query         = {'guid'       :guid};
					var newOnlinestat = {'onlinestat' :true};
					var options       = {upsert:false};
					Session.findOneAndUpdate(query, newOnlinestat, options, function(err, session){
				    	//if (err) res.send(500, { error: err });
					});
					//console.log('clients_table', clients_table);
				}
			}
			catch(err) {
				console.log('catch:', err);
			    //console.log('error on the message conveint to JSON:', message);
			}
			/* -----------------------  END RECEIVING GUID from client  --------------------------*/
			
		})

		// 클라이언트가 연결을 끊으면 Lo-Dash를 사용해 목록에서 클라이언트를 제거한다.
		// 연결이 끊어진 클라이언트로 메세지를 송신하려 시도하면 고약한 에러가 발생하므로,
		// 꼭 끊어줘야 된다는 것을 명심하자!
		/* -----------------------  CLOSING SOCKET  --------------------------*/
		ws.on('close', function(){ 
			console.log('user socket closeing..');

			setTimeout(function(){
				// for new socket array
				for (var key in clients_table) {
					console.log('checking key:', key, ' is the one that we are removing');

				  if (clients_table.hasOwnProperty(key) && clients_table[key] == ws) {
				    // online stat to be false
					var query         = {'guid'       :key};
					var newOnlinestat = {'onlinestat' :false};
					var options       = {upsert:false};
					Session.findOneAndUpdate(query, newOnlinestat, options, function(err, session){
				    	if (err) console.log("error on closing socket");

				    	console.log('socket closed:', key)

				    	delete clients_table[key];
					});
				  }
				}
			}, 2500)
			
			
			// for old socket array
			_.remove(clients, ws);
		});
		/* -----------------------  END CLOSING SOCKET  --------------------------*/
	});
};


