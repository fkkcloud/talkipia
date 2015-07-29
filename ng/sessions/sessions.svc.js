angular.module('app')
.service('SessionSvc', function($http){
	this.fetch = function(){
		return $http.get('/api/sessions');
	};

	this.enter = function(session){
		session.devicetoken = '0'; // for web, there is no devicetoken
		return $http.post('/api/sessions', session);
	};

	this.remove = function(guid){
		//console.log("deleting session");
		//console.log('session.guid:', guid);
		var session = {guid: guid};
		return $http.post('/api/sessions/delete', session);
	};

	this.updateWatchLocation = function(current_map_nw, current_map_se, current_map_center, guid){
		var watchloc = {
            nw_lat     : current_map_nw.lat,
            nw_lon     : current_map_nw.lon,
            se_lat     : current_map_se.lat,
            se_lon	   : current_map_se.lon,
            center_lat : current_map_center.lat,
            center_lon : current_map_center.lon
        }

        var watchlocJSON = JSON.stringify(watchloc);

        var updatedsession = {
            watchloc: watchlocJSON,
            guid    : guid
        };

        // update watchloc when center changed.
        console.log("updating watch location");

		//console.log("updatedsession:", updatedsession);
		return $http.post('/api/sessions/update_session', updatedsession);
	};

	this.updateCoupling = function(guid, guidtgt){
		
		var updatedguidtgt = {
			guid   : guid,
			guidtgt: guidtgt
		};

		// update watchloc when center changed.
        console.log("updating coupling");

		return $http.post('/api/sessions/update_coupling', updatedguidtgt)
	};
});
