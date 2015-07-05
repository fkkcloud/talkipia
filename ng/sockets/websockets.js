angular.module('app')
.run(function($rootScope, $timeout){
	var url;

	var hostname = document.location.hostname;
	
	var developmentIP = "192.168.0.4";

	if (hostname == "localhost" || hostname == developmentIP) {
		url = 'ws://192.168.0.4:5000'; // developmet on socket locally 
	}
	else {
		url = 'wss://frozen-badlands-8649.herokuapp.com'; // production deploy version - still debug mode
	}
	var connection = new WebSocket(url);

	var reconnect =function(){
		connection = new WebSocket(url);
	}

	connection.onopen = function(){
		console.log('WebSocket connected');
	};

	connection.onclose = function(){
		console.log('WebSocket closed. Reconecting...');
		$timeout(reconnect, 10*10000);
	};

	connection.onmessage = function(e){
		console.log(e);
		var payload = JSON.parse(e.data);
		$rootScope.$broadcast('ws:' + payload.type, payload.data);
	}
});