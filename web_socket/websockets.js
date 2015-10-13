var _ = require('lodash');
var ws = require('ws');

var clients = []; // ws array
var clients_table = {}; // ws hash table with guid

exports.getClient = function(guid){
	return clients_table[guid];
}

exports.getClients = function(){
	return clients;
};

exports.broadcastTo = function(guid_list, data){
	var json = JSON.stringify({type: type, data: data});

	guid_list.forEach(function(guid){
		clients_table[guid].send(json)
	});
}

exports.connect = function(server){
	var wss = new ws.Server({server: server});

	// 클라이언트가 서버소켓에 연결되었을때, client배열에 클라이언트의 웹소켓을 저장하여
	// 항상 트랙킹할수 있도록 한다.
	wss.on('connection', function(ws){ 
		console.log('new client connected.');

		clients.push(ws);
		
		exports.broadcast('server said - new client connected.'); // 클라이언트가 서버의 웹소켓에 접속할때 broadcast

		/* this is for saving ws to corresponding guid */
		ws.on('message', function incoming(message){
			//console.log('received message: %s', message);

			try {
			    var received_package = JSON.parse(message);

				//console.log(received_package);

				if (received_package.payload_type == '101386')
				{
					var guid = received_package.guid;
					clients_table[guid] = ws;
					//console.log('clients_table', clients_table);
				}
			}
			catch(err) {
			    //console.log('error on the message conveint to JSON:', message);
			}
			
			
		})

		// 클라이언트가 연결을 끊으면 Lo-Dash를 사용해 목록에서 클라이언트를 제거한다.
		// 연결이 끊어진 클라이언트로 메세지를 송신하려 시도하면 고약한 에러가 발생하므로,
		// 꼭 끊어줘야 된다는 것을 명심하자!
		ws.on('close', function(){ 
			console.log('user socket closed.');

			for (var key in clients_table) {
			  if (clients_table.hasOwnProperty(key) && clients_table[key] == ws) {
			    delete clients_table[key];
			  }
			}

			_.remove(clients, ws);
		});
	});
};

exports.broadcast = function(type, data){
	var json = JSON.stringify({type: type, data: data});

	// 각각의 선택된 클라이언트에게 json을 보낸다.
	clients.forEach(function(client){
		client.send(json)
	});
};
