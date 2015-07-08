angular.module('app').controller('PostsCtrl', function ($rootScope, $scope, PostsSvc, $window, $document){	/* emit broadcast for current pageId */	$scope.$emit('pagechange', $scope.pageId.post);	$scope.posts = [];	/* as server tells there was new post, lets re-load list data */	$scope.$on('ws:new_post', function(_, post){		$scope.requestFetch();	});	/* move to post's location */	$scope.moveToLoc = function(id){		var post = ($scope.posts[id]);		var location = angular.fromJson(post.location);		var googleLoc = new google.maps.LatLng(location.lat, location.lon);		$scope.map.panTo(googleLoc);		$scope.map.setZoom(16);		/* using angular-scroll to move to the top smoothly */		var top = 0;    	var duration = 480;    	$document.scrollTop(top, duration).then(function() {     		 console && console.log('You just scrolled to the top!');    	});	};	$scope.addPost = function() {		/* get autocompleted place and reset(set to undefined) */		var place = $scope.postplace;		var location = $scope.postLocation;		var locationJSON = JSON.stringify(location);		PostsSvc.create(		{			body    :  $scope.content,			location:  locationJSON,			place   :  place,			guid    :  $scope.guid,			guidtgt :  $scope.guidtgt		})		.success(function(post){			/* manually reload markers 			using maptypeid since its most least used event, - kind of hacky way to do it			*/			google.maps.event.trigger($scope.map, 'maptypeid_changed');			$scope.posts.unshift(post);			/* 10초보다 긴 경우의 것만 서버가 계산을 하고 서버가 보내줘서 frontend에서 지우도록 관리해줘야 한다.			 리스트인데 현재는 안보이게 해둔 상 */            var maxInstantLifeSpan = 10000;            if (post.lifespan < maxInstantLifeSpan){            	/* front end side list post remove */				var frontEndPostRemove = function(){ 					for (var i = 0; i < $scope.posts.length; ++i){						if (post._id == $scope.posts[i]._id)						{							$scope.posts.splice(i, 1);						}					}				};				setTimeout(frontEndPostRemove, post.lifespan);            }						/* reset input forms */			$scope.content  = null;		})		.error(function(data, status){			swal("Post failed", "Please complete the from correctly", "error");		});	};	/* as server tells there was new post, lets re-load list data */	$scope.requestFetch = function() {		PostsSvc.fetch()		.success(function(posts){			$scope.posts = posts;		});	};	$scope.requestFetch();});