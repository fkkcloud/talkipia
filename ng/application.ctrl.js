
angular.module('app')
.controller('ApplicationCtrl', function(SessionSvc, $rootScope, $scope, $window, $http, $timeout){

	//-----GUID-----------------------------------------------------------------------------
	// 지금은 난수를 만들고 있으나 GUID자체를 grab해서 쓸수 있도록 바꾸는게 좋을듯 하다.
	function guid() {
		function s4() {
		    return Math.floor((1 + Math.random()) * 0x10000)
		      .toString(16)
		      .substring(1);
		}
	  	return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
	}

	$scope.guid = guid();

	//-----END OF GUID------------------------------------------------------------------------


	//-----Initials---------------------------------------------------------------------
	// 윈도우가 닫히려고 하면 리퀘스트 보낸다! 유져 세션을 닫으라고!
	window.onbeforeunload = function(){
		SessionSvc.remove($scope.guid); // 서버에서 유저가 나감을 알린다
	}

	//-----END OF Initials--------------------------------------------------------------


	//-----SOCKET-----------------------------------------------------------------------------
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
		url = 'wss://cloudtalk.herokuapp.com'; // production deploy version - still debug mode
	}

	/* 개발과정이 끝나고 배포시에는 위부분을 지우고 아래 코드만 남겨도 된다.
	url = 'wss://frozen-badlands-8649.herokuapp.com';
	*/
	var connect = function() {
		connection = new WebSocket(url);

		connection.onopen = function(){
			function getCurrLocSuccess(pos) {
				// 맨처음에는 유저의 실제 위치(앱에 입장했을때의 위치)와 센터 포지션을 같이 보내고,
				// 센터 포지션은 계속 업데이트 되어야 한다.
	            var crd = pos.coords;

	            var googleLoc = new google.maps.LatLng(crd.latitude, crd.longitude);

	            var watchloc = {
	            	lat:window.localStorage.latitude,
	            	lon:window.localStorage.longitude
	        	};

	        	var location = {
	        		lat:googleLoc.lat(),
	        		lon:googleLoc.lng()
	        	};

	        	var watchlocJSON = JSON.stringify(watchloc);
	        	var locationJSON = JSON.stringify(location);

	        	console.log("setting watchloc", watchlocJSON);
	        	console.log("setting location", locationJSON);
	            
	            //여기서 비동기적으로 유저의 로케이션을 얻고 세션을 보낼수 있다.
				var session = {
					guid:     $scope.guid,
					location: locationJSON,
					watchloc: watchlocJSON
				};
				SessionSvc.enter(session); // 서버에서 유저가 들어옴을 알린다.
	        }

	        function getCurrLocError(err) {
	            console.warn('ERROR(' + err.code + '): ' + err.message);
	        }

	        /* init map and place some markers, so everything start with this function. */
	        navigator.geolocation.getCurrentPosition(getCurrLocSuccess, getCurrLocError);

			console.log('WebSocket connected');
		};

		connection.onclose = function(){

			console.log('WebSocket closed. Reconecting...');
			$timeout(connect, 2000);
		};

		connection.onmessage = function(e){
			console.log('broadcast msg from server:', e);
			var payload = JSON.parse(e.data);

			/*
				ws:new_post    - 새로운 포스트가 올라왔을때 front-end에서 맵이 다시 업데이트 해야 된다고 알려준다!
				ws:new_session - session이 새로 들어오면 된다고 알려준다!
				매우중요! 
			*/
			$rootScope.$broadcast('ws:' + payload.type, payload.data);
		};
	};
	connect();
	//-----END OF SOCKET-----------------------------------------------------------------------

	// see if its mobile phone
	$scope.isMobile = function(){
		if( navigator.userAgent.match(/Android/i)
		 || navigator.userAgent.match(/webOS/i)
		 || navigator.userAgent.match(/iPhone/i)
		 || navigator.userAgent.match(/iPad/i)
		 || navigator.userAgent.match(/iPod/i)
		 || navigator.userAgent.match(/BlackBerry/i)
		 || navigator.userAgent.match(/Windows Phone/i)
		 ){
		    return true;
		  }
		 else {
		    return false;
		  }
	};

	$scope.guidtgt = "0"; // 기본값은 0으로 해서 0이면 관심상대guid가 없는 상태이다. 
	$scope.$on('set:guidtgt', function(_, guidtgt){
		console.log("setting guidtgt", guidtgt);
		$scope.guidtgt = guidtgt;
	});

	$scope.pageId = { 
		post : 0,
	};

	$scope.navCollapsed = true;
	$scope.collapse = function(){
		$scope.navCollapsed = true;
	};

	// as server socket send 'ws:new_post' , we can update the map!
	$scope.$on('ws:new_post', function(_, post){
		// update posts
		google.maps.event.trigger($scope.map, 'maptypeid_changed');

		// show responsive users
		google.maps.event.trigger($scope.map, 'maptypeid_changed', {type:'res_post'});
	});

	// as server socket send 'ws:new_post' , we can update the map!
	$scope.$on('ws:new_session', function(_, session){
		var options = {
			type: 'res_login',
			data: session
		}
		google.maps.event.trigger($scope.map, 'maptypeid_changed', options);
	});

	// when server remove the post after time for longer ones, 
	// update map with coresponding info
	$scope.$on('ws:remove_post', function(_, postid){
		var options = {
			type:'res_post_remove',
			data: postid
		}
		google.maps.event.trigger($scope.map, 'maptypeid_changed', options);
	});


	$scope.$on('pagechange', function(_, pageId){
		$scope.currentPageId = pageId;
	});

	$scope.$on('loc', function(_, location){
		var lat = location.lat();
		var lon = location.lng();
		$scope.postLocation = {
			lat: lat,
			lon: lon
		};
	});

	$scope.$on('place', function(_, place){
		// Forcing the update with $apply() method on $scope
		// problem related note: http://www.jeffryhouser.com/index.cfm/2014/6/2/How-do-I-run-code-when-a-variable-changes-with-AngularJS
		$scope.$apply(function(){
				$scope.postplace = place;
			}
		);
	});

	$scope.$on('mapInit', function(_, map){
		$scope.map = map;
		
		// update map bounds as app launches
		google.maps.event.trigger($scope.map, 'center_changed');
	});

	/* move to current location */
	$scope.moveToCurrentLocation = function(){
		function getCurrLocSuccess(pos) {
            /* make sure to check we are on post page with map first */
            if ($scope.currentPageId != $scope.pageId.post)
                return;

            var crd = pos.coords;

            window.localStorage.latitude = crd.latitude;
            window.localStorage.longitude = crd.longitude;

            var googleLoc = new google.maps.LatLng(crd.latitude, crd.longitude);

            // draw drop down user position
           	var options = { type: 'curr_loc', location: googleLoc};
	        google.maps.event.trigger($scope.map, 'heading_changed', options);

			var options = { type: 'curr_x', location: googleLoc};
	        google.maps.event.trigger($scope.map, 'heading_changed', options);

            $scope.map.panTo(googleLoc)
            $scope.map.setZoom(15);
        }

        function getCurrLocError(err) {
            console.warn('ERROR(' + err.code + '): ' + err.message);
        }

        /* init map and place some markers, so everything start with this function. */
        navigator.geolocation.getCurrentPosition(getCurrLocSuccess, getCurrLocError);

        swal({   title: "",   text: "Moving to current location..",   timer: 1500,   showConfirmButton: false });
	};

	$scope.moveToPostLocation = function(){
		var latDelta = 0.0;

		if ($scope.isMobile()){
			var bounds = $scope.map.getBounds();
	        var ne = bounds.getNorthEast(); // LatLng of the north-east corner
	        var sw = bounds.getSouthWest(); // LatLng of the south-west corder
	        current_map_nw = new google.maps.LatLng(ne.lat(), sw.lng());
	        current_map_se = new google.maps.LatLng(sw.lat(), ne.lng());

	        var latDelta_center2north = 0.5 * Math.abs($scope.postLocation.lat - current_map_nw.lat());
	        var latDelta_center2south = 0.5 * Math.abs($scope.postLocation.lat - current_map_se.lat());

	        if (latDelta_center2north > latDelta_center2south){
	        	latDelta = latDelta_center2south;
	        }
	        else {
	        	latDelta = latDelta_center2north;
	        }
		}

		var googleLoc = new google.maps.LatLng($scope.postLocation.lat + latDelta, $scope.postLocation.lon);
		$scope.map.panTo(googleLoc);
	};


});