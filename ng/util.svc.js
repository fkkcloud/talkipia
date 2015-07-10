angular.module('app')
.service('UtilSvc', function(){
	var svc = this;

	svc.deg2rad = function(deg) {
	  return deg * (Math.PI/180);
	};

	svc.getDistanceFromLatLonInKm = function (lat1,lon1,lat2,lon2) {
	  var R = 6371;
	  var dLat = svc.deg2rad(lat2-lat1);
	  var dLon = svc.deg2rad(lon2-lon1); 
	  var a = 
	    Math.sin(dLat/2) * Math.sin(dLat/2) +
	    Math.cos(svc.deg2rad(lat1)) * Math.cos(svc.deg2rad(lat2)) * 
	    Math.sin(dLon/2) * Math.sin(dLon/2)
	    ; 
	  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
	  var d = R * c;
	  return d;
	};

	svc.mapRange = function (value, low1, high1, low2, high2) {
	    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
	}
});