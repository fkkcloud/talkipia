angular.module('app')
.service('SessionSvc', function($http){
	this.fetch = function(){
		return $http.get('/api/sessions');
	};

	this.enter = function(session){
		return $http.post('/api/sessions', session);
	};

	this.remove = function(guid){
		//console.log("deleting session");
		//console.log('session.guid:', guid);
		var session = {guid: guid};
		return $http.put('/api/sessions', session);
	};

	this.updateWatchLocation = function(current_map_nw, current_map_se, current_map_center, guid){
		var watchloc = {
            nw_lat    : current_map_nw.lat,
            nw_lon    : current_map_nw.lon,
            se_lat    : current_map_se.lat,
            se_lon	  : current_map_se.lon,
            center_lat: current_map_center.lat,
            center_lon: current_map_center.lon
        }

        var watchlocJSON = JSON.stringify(watchloc);

        var updatedsession = {
            watchloc: watchlocJSON,
            guid: guid
        };

        // update watchloc when center changed.
        console.log("updating watch location");
		//console.log("updatedsession:", updatedsession);
		return $http.post('/api/sessions/update', updatedsession);
	};
});
