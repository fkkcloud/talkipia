
angular.module('app')
.controller('ApplicationCtrl', function($rootScope, $scope, $window, $http){
	// get current platform
	$scope.curr_platform = navigator.platform;

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
		google.maps.event.trigger($scope.map, 'maptypeid_changed');
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

            //console.log('Latitude : ' + crd.latitude);
            //console.log('Longitude: ' + crd.longitude);
            //console.log('More or less ' + crd.accuracy + ' meters.');
            var googleLoc = new google.maps.LatLng(crd.latitude, crd.longitude);

            google.maps.event.trigger($scope.map, 'heading_changed', googleLoc);
            
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

	$scope.$on('pagechange', function(_, pageId){
		$scope.currentPageId = pageId;
	});

	$scope.$on('loc', function(_, location){
		console.log('IN:',location);
		var lat = location.lat();
		var lon = location.lng();
		$scope.postLocation = {
			lat: lat,
			lon: lon
		};
		console.log('SAVED:', $scope.postLocation);
	});

	$scope.$on('place', function(_, place){
		// Forcing the update with $apply() method on $scope
		// problem related note: http://www.jeffryhouser.com/index.cfm/2014/6/2/How-do-I-run-code-when-a-variable-changes-with-AngularJS
		$scope.$apply(function(){
				$scope.postplace = place;
				console.log('SAVED:', $scope.postplace);
			}
		);
	});

	$scope.$on('mapInit', function(_, map){
		$scope.map = map;
		
		// update map bounds as app launches
		google.maps.event.trigger($scope.map, 'center_changed');
	});

});