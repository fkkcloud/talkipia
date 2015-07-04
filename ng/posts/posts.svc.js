angular.module('app')
.service('PostsSvc', function($http){
	this.fetch = function(){
		return $http.get('/api/posts');
	};

	this.create = function(post){
		return $http.post('/api/posts', post);
	};

	this.remove = function(post){
		console.log("deleting posting");
		console.log('post._id:', post._id);
		return $http.put('/api/posts', post);
	};
});