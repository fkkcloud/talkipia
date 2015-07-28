angular.module('app')
.service('PostsSvc', function($http){
	this.fetch = function(guidObj){
		return $http.get('/api/posts', guidObj);
	};

	this.create = function(post){
		post.devicetoken = '0'; // for web, there is no devicetoken
		return $http.post('/api/posts', post);
	};

	this.remove = function(post){
		//console.log("deleting posting");
		//console.log('post._id:', post._id);
		return $http.post('/api/posts/posts_delete', post);
	};

	this.updateGuidtgt = function(updates){
		return $http.post('/api/posts/update_guidtgt', updates);
	}
});