angular.module('app')
.run(function($rootScope, $timeout){

	//---------------------------------------------------------------------------------------------

	var url;

	var hostname = document.location.hostname;
	var developmentIP = "192.168.0.4";

	if (hostname == "localhost"){
		url = "ws://localhost:5000";
	}
	else if (hostname == developmentIP) {
		url = 'ws://192.168.0.4:5000'; // developmet on socket locally 
	}
	else {
		url = 'wss://fandomchat.herokuapp.com'; // production deploy version - still debug mode
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
			$timeout(connect, 2000);
		};

		connection.onmessage = function(e){
			console.log(e);
			var payload = JSON.parse(e.data);

			// 새로운 포스트가 올라왔을때 front-end에서 맵이 다시 업데이트 해야 된다고 알려준다!
			// 매우중요!
			$rootScope.$broadcast('ws:' + payload.type, payload.data);
		};
	};

	connect();
});