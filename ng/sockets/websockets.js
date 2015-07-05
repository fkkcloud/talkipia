angular.module('app')
.run(function($rootScope, $timeout){

	// get current platform
	$rootScope.curr_platform = navigator.platform;

	// 지금은 난수를 만들고 있으나 GUID자체를 grab해서 쓸수 있도록 바꾸는게 좋을듯 하다.
	function guid() {
		function s4() {
		    return Math.floor((1 + Math.random()) * 0x10000)
		      .toString(16)
		      .substring(1);
		}
	  	return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
	}

	$rootScope.guid = guid();
	// server에 보냄 guid를!

	//---------------------------------------------------------------------------------------------

	var url;

	var hostname = document.location.hostname;
	var developmentIP = "192.168.0.4";
	if (hostname == "localhost" || hostname == developmentIP) {
		url = 'ws://192.168.0.4:5000'; // developmet on socket locally 
	}
	else {
		url = 'wss://frozen-badlands-8649.herokuapp.com'; // production deploy version - still debug mode
	}

	/* 개발과정이 끝나고 배포시에는 위부분을 지우고 아래 코드만 남겨도 된다.
	url = 'wss://frozen-badlands-8649.herokuapp.com';
	*/

	var connect = function() {
		connection = new WebSocket(url);

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
	};

	connect();
});