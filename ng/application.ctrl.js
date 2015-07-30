
angular.module('app')
.controller('ApplicationCtrl', function(SessionSvc, UtilSvc, ConfigSvc, $rootScope, $scope, $window, $http, $timeout){

    //------------------------------------------------------------------------------------
    // INITIAL
    //------------------------------------------------------------------------------------

    window.onbeforeunload = function(e) {
    	SessionSvc.remove($scope.guid);
	};

	window.onpageshow = function(e) {
		$scope.initSession();
		if ($scope.map)
	  		$scope.map.updateAndDrawPosts();
	};

	window.onpagehide = function(e) {
    	SessionSvc.remove($scope.guid);
	};

	document.addEventListener("visibilitychange", function() {
	  if (document.visibilityState == 'visible' || 
	  	document.visibilityState == 'mozVisible' || 
	  	document.visibilityState == 'msVisible' ||
	  	document.visibilityState == 'webkitVisible')
	  {
	  	$scope.initSession();
	  	if ($scope.map)
	  		$scope.map.updateAndDrawPosts();
	  	console.log("its back");
	  } 
	  else if (document.visibilityState == 'hidden' || 
	  	document.visibilityState == 'mozHidden' || 
	  	document.visibilityState == 'msHidden' ||
	  	document.visibilityState == 'webkitHidden')
	  {
	  	SessionSvc.remove($scope.guid);
	  	console.log("going to background");
	  }
	});

	document.addEventListener("webkitvisibilitychange", function() {
		//alert("WEBKIT!");
	  if (document.webkitVisible)
	  {
	  	$scope.initSession();
	  	if ($scope.map)
	  		$scope.map.updateAndDrawPosts();
	  	alert("its back");
	  } 
	  else if (document.webkitHidden)
	  {
	  	SessionSvc.remove($scope.guid);
	  	alert("going to background");
	  }
	}, false);

	$scope.initSession = function(){
		if ($scope.map == 'undefined' || $scope.map == 'null' || !$scope.map)
			return;

		function getCurrLocSuccess(pos) {	
			////////////////// PHYSICAL LOCATION
			// 맨처음에는 유저의 실제 위치(앱에 입장했을때의 위치)와 센터 포지션을 같이 보내고,
			// 센터 포지션은 계속 업데이트 되어야 한다.
	        var crd = pos.coords;

	        var googleLoc = new google.maps.LatLng(crd.latitude, crd.longitude);

	        // save the user location into application scope variable
	        $scope.userLocation = {
	        	lat: crd.latitude,
	        	lon: crd.longitude
	        };

	        var location = {
	    		lat:googleLoc.lat(),
	    		lon:googleLoc.lng()
	    	};
	    	var locationJSON = JSON.stringify(location);
	    	//console.log("setting location", locationJSON);

	    	////////////////// WATCH LOCATION
	    	var bounds = $scope.map.getBounds();
	        var ne = bounds.getNorthEast(); // LatLng of the north-east corner
	        var sw = bounds.getSouthWest(); // LatLng of the south-west corder
	        //You get north-west and south-east corners from the two above:

	        var current_map_nw = { 
	            lat: ne.lat(), 
	            lon: sw.lng()
	        };
	        var current_map_se = {
	            lat: sw.lat(), 
	            lon: ne.lng()
	        };

	        var current_map_center = {
	        	lat:window.localStorage.latitude,
	        	lon:window.localStorage.longitude
	    	};

	        var watchloc = {
	            nw_lat    : current_map_nw.lat,
	            nw_lon    : current_map_nw.lon,
	            se_lat    : current_map_se.lat,
	            se_lon	  : current_map_se.lon,
	            center_lat: current_map_center.lat,
	            center_lon: current_map_center.lon
	        }

        	var watchlocJSON = JSON.stringify(watchloc);
        	//console.log("setting watchloc", watchlocJSON);
            
            ////////////////// LOCATION UPDATE WITH SESSION ENTER
            //여기서 비동기적으로 유저의 로케이션을 얻고 세션을 보낼수 있다.
			var session = {
				guidtgt : $scope.guidtgt,
				guid    : $scope.guid,
				location: locationJSON,
				watchloc: watchlocJSON
			};
			SessionSvc.enter(session); // 서버에서 유저가 들어옴을 알린다.
	    }

	    function getCurrLocError(err) {
        	swal("", "Need to turn on location service for proper use.");
            console.warn('ERROR(' + err.code + '): ' + err.message);
        }

        // init map and place some markers, so everything start with this function.
        var options = {
		  enableHighAccuracy: false,
		  timeout: 5000,
		  maximumAge: 0
		};
	    navigator.geolocation.getCurrentPosition(getCurrLocSuccess, getCurrLocError, options);
		swal({   title: "",   text: "Retreiving currnet location..",   timer: 3500,   showConfirmButton: false });
	};

    // load and set latest guid
	if (window.localStorage.guid == 'undefined' || 
		window.localStorage.guid == 'null' ||
		!window.localStorage.guid)
	{
		window.localStorage.guid = UtilSvc.getGuid();
	}
	$scope.guid = window.localStorage.guid;

	// load and set latest guidtgt
	if (window.localStorage.guidtgt == 'undefined' || 
		window.localStorage.guidtgt == 'null' ||
		!window.localStorage.guidtgt)
	{
		window.localStorage.guidtgt = "0";
	}
	$scope.guidtgt = window.localStorage.guidtgt; // interested opponent guid number

	$scope.pageId = { 
		post : 0,
	};

	$scope.navCollapsed = true;

	// value from time slider in UI
	// default is max instant life span
    $scope.timevalue = ConfigSvc.maxInstantLifeSpan;

	// user's current location storage
	$scope.userLocation = {
		lat: 0.0,
		lon: 0.0
	};

	$scope.toggleSearchLocation = false;
	$scope.toggleTimeSlider = false;

	// event hander for map UIs
	$timeout(function(){
		// enables enter key to submit post form
		document.getElementById('map-posting').onkeypress = function(event){
			//console.log("Inside keypress",event.which);
			if (event.which == '13'){
				//console.log("enter pressed");
				$('form#map-posting-form').submit();
			}
		}

		document.getElementById('map-posting').onfocus = function(event){
			console.log("on focus");
			$scope.toggleTimeSlider = true;
		}

		document.getElementById('map-posting').onblur = function(event){
			console.log("on blur");
			$scope.toggleTimeSlider = false;
		}

		$('.nav-burger').click(function() {
		  $('.nav-burger').toggleClass('active');
		  //$('.controls').toggleClass('active');
		  $scope.toggleSearchLocation = !$scope.toggleSearchLocation;
		  $scope.$apply();
		});

	});

    //------------------------------------------------------------------------------------
    // SOCKET
    //------------------------------------------------------------------------------------
	var url;
	var hostname = document.location.hostname;

	if (hostname == ConfigSvc.local){
		url = ConfigSvc.web_socket + ConfigSvc.local + ':' + ConfigSvc.port;
	}
	else if (hostname == ConfigSvc.local_ip) {
		url = ConfigSvc.web_socket + ConfigSvc.local_ip + ':' + ConfigSvc.port; // developmet on socket locally 
	}
	else {
		url = ConfigSvc.web_socket + ConfigSvc.deploy_dns; // production deploy version - still debug mode
		//url = ConfigSvc.web_socket_secure + ConfigSvc.deploy_dns; // production deploy version - still debug mode
	}

	/* 개발과정이 끝나고 배포시에는 위부분을 지우고 아래 코드만 남겨도 된다.
	url = 'wss://frozen-badlands-8649.herokuapp.com';
	*/
	var connect = function() {
		connection = new WebSocket(url);

		connection.onopen = function(){

			// send guid to server for ws identification
			connection.send($scope.guid);
			console.log('WebSocket connected');
		};

		connection.onclose = function(){

			console.log('WebSocket closed. Reconecting...');
			$timeout(connect, 2000);
		};

		connection.onmessage = function(e){
			//console.log('broadcast msg from server:', e);
			var payload = JSON.parse(e.data);

			/*
				ws:new_post    - 새로운 포스트가 올라왔을때 front-end에서 맵이 다시 업데이트 해야 된다고 알려준다!
				ws:new_session - session이 새로 들어오면 된다고 알려준다!
				ws:remove_post - 포스트가 시간이 다 되어서 사라질때!
				매우중요! 
			*/
			console.log('ws:' + payload.type);
			$rootScope.$broadcast('ws:' + payload.type, payload.data);
		};
	};
	connect();

	//------------------------------------------------------------------------------------
    // SOCKET BROADCAST RECEIVER
    //------------------------------------------------------------------------------------
	// as server socket send 'ws:new_post' , we can update the map!
	$scope.$on('ws:new_post', function(_, post){
		// update posts on map
		$scope.map.updateAndDrawPosts();

		// show responsive users only to the user who wrote this post
		if (post.guid == $scope.guid)
		{
			//console.log('start drawing responses..');
			$scope.map.drawResponses(post);
		}
	});

	// as server socket send 'ws:new_post' , we can update the map!
	$scope.$on('ws:new_session', function(_, session){
		var location = angular.fromJson(session.location);
		$scope.map.drawCurrLocationMarker(location);

	});

	// when server remove the post after time for longer ones, 
	// update map with coresponding info
	$scope.$on('ws:remove_post', function(_, postid){
		$scope.map.unDrawPost(postid);
	});

	$scope.$on('ws:update_guidtgt', function(_, updatedSession){
		// update posts on map
		$scope.map.updateAndDrawPosts();
	});

	//------------------------------------------------------------------------------------
    // APPLICATION LEVEL FUNCTIONS
    //------------------------------------------------------------------------------------
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

	/* move to current location */
	$scope.moveToCurrentLocation = function(){
		function getCurrLocSuccess(pos) {
            /* make sure to check we are on post page with map first */
            if ($scope.currentPageId != $scope.pageId.post)
                return;

            var crd = pos.coords;

            window.localStorage.latitude = crd.latitude;
            window.localStorage.longitude = crd.longitude;

            var location = {
            	lat: crd.latitude, 
            	lon: crd.longitude
            };

            // draw drop down user position
           	$scope.map.drawCurrLocationMarker(location);

           	// draw x marker
	        $scope.map.drawXMarker(location);

	        var googleLoc = new google.maps.LatLng(location.lat, location.lon);

	        // move to the location and zoom into right amount
            $scope.map.panTo(googleLoc)
            $scope.map.setZoom(15);
        }

        function getCurrLocError(err) {
        	swal("", "Need to turn on location service for proper use.");
            console.warn('ERROR(' + err.code + '): ' + err.message);
        }

        // init map and place some markers, so everything start with this function.
        var options = {
		  enableHighAccuracy: true,
		  timeout: 8000,
		  maximumAge: 0
		};
        navigator.geolocation.getCurrentPosition(getCurrLocSuccess, getCurrLocError, options);

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

		var centerLoc = $scope.map.getCenter();

		var googleLoc = new google.maps.LatLng($scope.postLocation.lat + latDelta, centerLoc.lng());
		$scope.map.panTo(googleLoc);
	};

	$scope.collapse = function(){
		$scope.navCollapsed = true;
	};

	//------------------------------------------------------------------------------------
    // GENERAL BROADCAST RECEIVER
    //------------------------------------------------------------------------------------
    $scope.$on('set:map', function(_, map){
		$scope.map = map;
	});

    $scope.$on('set:guidtgt', function(_, guidtgt){
		$scope.guidtgt = guidtgt;

		// its very imporant to set local storage guidtgt
		window.localStorage.guidtgt = guidtgt;
	});

	$scope.$on('set:pagechange', function(_, pageId){
		$scope.currentPageId = pageId;
	});

	$scope.$on('set:loc', function(_, location){
		var lat = location.lat();
		var lon = location.lng();
		$scope.postLocation = {
			lat: lat,
			lon: lon
		};
	});

	$scope.$on('set:place', function(_, place){
		// Forcing the update with $apply() method on $scope
		// problem related note: http://www.jeffryhouser.com/index.cfm/2014/6/2/How-do-I-run-code-when-a-variable-changes-with-AngularJS
		$scope.$apply(function(){
				$scope.postplace = place;
			}
		);
	});
});