var _ = require('lodash');
var ws = require('ws');

var clients = [];

exports.connect = function(server){
	var wss = new ws.Server({server: server});

	// 클라이언트가 서버소켓에 연결되었을때, client배열에 클라이언트의 웹소켓을 저장하여
	// 항상 트랙킹할수 있도록 한다.
	wss.on('connection', function(ws){ 
		console.log('new client connected.');

		clients.push(ws);

		exports.broadcast('server said - new client connected.'); // 클라이언트가 서버의 웹소켓에 접속할때 broadcast

		// 클라이언트가 연결을 끊으면 Lo-Dash를 사용해 목록에서 클라이언트를 제거한다.
		// 연결이 끊어진 클라이언트로 메세지를 송신하려 시도하면 고약한 에러가 발생하므로,
		// 꼭 끊어줘야 된다는 것을 명심하자!
		ws.on('close', function(){ 
			_.remove(clients, ws);
		});
	});
};

exports.broadcast = function(type, data){
	var json = JSON.stringify({type: type, data: data});

	// 각각의 클라이언트에게 json을 보낸다.
	clients.forEach(function(client){
		client.send(json);
	});
};
