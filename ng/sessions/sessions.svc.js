angular.module('app')
.service('SessionSvc', function($http){
	this.fetch = function(){
		return $http.get('/api/sessions');
	};

	this.enter = function(session){
		return $http.post('/api/sessions', session);
	};

	this.remove = function(guid){
		console.log("deleting session");
		console.log('session.guid:', guid);
		var session = {guid: guid};
		return $http.put('/api/sessions', session);
	};

	this.update = function(updatedsession){
		console.log("updating watch location");
		console.log("updatedsession:", updatedsession);
		return $http.post('/api/sessions/update', updatedsession);
	}
});
