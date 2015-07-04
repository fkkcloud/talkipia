
angular.module('app')
.controller('ApplicationCtrl', function($rootScope, $scope, $window, $http){
	$scope.pageId = { 
		post : 0,
	};

	$scope.navCollapsed = true;
	$scope.collapse = function(){
		$scope.navCollapsed = true;
	};

	/*
	// 강아지 겟으로 맵 업데이트를 하는 방식.
	$scope.requestRefresh = function(){
		return $http.get('/api/refresh')
		.then(
		function(res){
			console.log("OKAY, server says we update the map!");

			$scope.$emit('refetch', {}); // to update list
			google.maps.event.trigger($scope.map, 'maptypeid_changed'); // to update map

			$scope.requestRefresh();
		},
		function(err){
			console.log("Error should not happen for this..:", err);
		});
	}
	$scope.requestRefresh();
	*/

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