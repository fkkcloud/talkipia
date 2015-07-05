angular.module('app')
.run(function($rootScope, $timeout){

	var connect =function(){
		//var url = 'ws://192.168.0.4:5000'; // developmetn locally 
		var url = 'wss://frozen-badlands-8649.herokuapp.com'; // production
		var connection = new WebSocket(url);
	}
	
	connect();

	connection.onopen = function(){
		console.log('WebSocket connected');
	};

	connection.onclose = function(){
		console.log('WebSocket closed. Reconecting...');
		$timeout(connect, 10*10000);
	};

	connection.onmessage = function(e){
		console.log(e);
		var payload = JSON.parse(e.data);
		$rootScope.$broadcast('ws:' + payload.type, payload.data);
	}
});