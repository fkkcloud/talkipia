angular.module('app')
.directive('appMap', function(PostsSvc, UtilSvc, ConfigSvc, SessionSvc, $compile, $timeout) {
    // directive link function
    var link = function(scope, element, attrs) {

        //------------------------------------------------------------------------------------
        // GLOBAL VARIABLES IN LINK FUNCTION
        //------------------------------------------------------------------------------------
        var map; // expand from google map for manually created events
        var map_origin; // for original google map event function links
        var current_map_nw;
        var current_map_se;
        var mapOptions;
        var initialMapCenter;
        var CLOUD_MAP_ID = 'custom_style'; // map style
        var helperMarkers = [];
        var markersOnMap = [];

        var prevGuidtgt = '0';
        var isGuidtgtChanged;

        var imagePost = {
            //url: 'https://catchme.ifyoucan.com/images/pictures/IYC_Icons/IYC_Location_Icon_Small.png',
            url: 'Default_Marker.png',
            size: new google.maps.Size(100, 100),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(17, 34),
            scaledSize: new google.maps.Size(1, 1)
        };
        var imageTarget = {
            //url: 'http://www.clker.com/cliparts/U/P/j/M/I/i/x-mark-yellow-md.png',
            url: 'X_Marker.png',
            size: new google.maps.Size(100, 100),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(17, 34),
            scaledSize: new google.maps.Size(25, 25)
        };
        var imageUserLogin = {
            //url: 'http://www.clker.com/cliparts/q/o/2/K/g/V/location-symbol-map-md.png',
            url: 'Current_Location_Marker.png',
            size: new google.maps.Size(100, 100),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(17, 34),
            scaledSize: new google.maps.Size(20, 33)
        };

        //------------------------------------------------------------------------------------
        // EVENT HANDLERS - UPDATE
        //------------------------------------------------------------------------------------
        function updateDefaultLocation()
        {
            window.localStorage.latitude = map.getCenter().lat();
            window.localStorage.longitude = map.getCenter().lng();
        }

        function updateBounds()
        {
            var bounds = map.getBounds();
            var ne = bounds.getNorthEast(); // LatLng of the north-east corner
            var sw = bounds.getSouthWest(); // LatLng of the south-west corder
            //You get north-west and south-east corners from the two above:

            current_map_nw = new google.maps.LatLng(ne.lat(), sw.lng());
            current_map_se = new google.maps.LatLng(sw.lat(), ne.lng());
        }

        function updateWatchLocation()
        {
            var bounds = map.getBounds();
            var ne = bounds.getNorthEast(); // LatLng of the north-east corner
            var sw = bounds.getSouthWest(); // LatLng of the south-west corder
            //You get north-west and south-east corners from the two above:

            current_map_nw = { 
                lat: ne.lat(), 
                lon: sw.lng()
            };
            current_map_se = {
                lat: sw.lat(), 
                lon: ne.lng()
            };

            var current_map_center ;

            // see if the latest x marker or post location is within user's view
            if (!(scope.postLocation.lat < current_map_nw.lat) ||
                !(scope.postLocation.lat > current_map_se.lat) ||
                !(scope.postLocation.lon < current_map_se.lon) ||
                !(scope.postLocation.lon > current_map_nw.lon) )
            {
                // if it is not within user's view, then just use map center
                current_map_center = {
                    lat: map.getCenter().lat(),
                    lon: map.getCenter().lng()
                };
            }
            else
            {
                // if it is within user's view, use x marker location a.k.a post location
                current_map_center = {
                    lat: scope.postLocation.lat,
                    lon: scope.postLocation.lon
                };
            }
            SessionSvc.updateWatchLocation(current_map_nw, current_map_se, current_map_center, scope.guid);
        }

        //------------------------------------------------------------------------------------
        // EVENT HANDLERS - DRAW
        //------------------------------------------------------------------------------------
        // update responses such as visualization of listeners
        function drawResponses(post){
            //console.log('reference post:', post);

            function drawBlinks(sessions){

                for (var i = 0; i < sessions.length; i++){
                    var session = sessions[i];

                    // skip my session - no need to draw 내 자신의 세션은 그릴필요가 없다.
                    if (session.guid == scope.guid)
                        continue;

                     // session's watch location will be bounced!
                    var watch_location = angular.fromJson(session.watchloc);
                    var post_location  = angular.fromJson(post.location);
                    
                    // 유저가 보고 있는 바운더리 안에 그 session(다른유저) 체킁

                    //console.log(current_map_se, current_map_nw);
                    updateBounds();
                    if (!(watch_location.center_lat < current_map_nw.lat()) ||
                        !(watch_location.center_lat > current_map_se.lat()) ||
                        !(watch_location.center_lon < current_map_se.lng()) ||
                        !(watch_location.center_lon > current_map_nw.lng()) )
                    {
                        continue;
                    }

                    // session(다른유저)들이 그 포스트를 보고 있지 않으면 스킵.
                    if (!(post_location.lat < watch_location.nw_lat) ||
                        !(post_location.lat > watch_location.se_lat) ||
                        !(post_location.lon < watch_location.se_lon) ||
                        !(post_location.lon > watch_location.nw_lon) )
                    {
                        continue;
                    }
                   
                    var googleLoc = new google.maps.LatLng(watch_location.center_lat, watch_location.center_lon);
                    
                    var randomSize = Math.random() * 40 + 40; 
                    var urlName    = 'Blink.gif';

                    var imageListener = {
                        url: urlName,
                        size: new google.maps.Size(100, 100),
                        origin: new google.maps.Point(0, 0),
                        anchor: new google.maps.Point(randomSize * 0.5 + 5, randomSize * 0.5 + 14),
                        scaledSize: new google.maps.Size(randomSize, randomSize)
                    };

                    (function(imageListener){
                        var markerOptions = {
                            position: googleLoc,
                            map: map,
                            title: "Receiver",
                            icon: imageListener,
                            optimized: false
                        };

                        var marker = new google.maps.Marker(markerOptions);
                        var receiver_marker_lifespan = 1200;

                        $timeout(
                            (function(old_marker){
                                return function(){
                                    old_marker.setMap(null);
                                    old_marker = null;
                                };
                            }(marker)), 
                        receiver_marker_lifespan);

                    }(imageListener));
                    
                }
            }

            SessionSvc.fetch()
            .success(drawBlinks)
            .catch(function(err){
                //handle errors
            });
        }

        // check if the post is completly dead and remove that post
        function cleanup() {
             for (var j = 0, marker; marker = markersOnMap[j]; j++){
                var currentDate      = new Date();
                var currentTimeMilli = currentDate.getTime();
                var life = marker.post.lifeend - currentTimeMilli;

                if (life <= 0){
                    //console.log('cleaning up..', marker.post._id);
                    unDrawPost(marker.post._id);
                }
            }
        }

        function updateAndDrawPosts(){
            cleanup();
            
            // for checking local posts - isPointingYou
            isGuidtgtChanged = prevGuidtgt != scope.guidtgt; // see if my guidtgt has changed;
            prevGuidtgt = scope.guidtgt; // update previous guidtgt

            function drawPosts(posts){

                for (var i = 0; i < posts.length; i++)
                {
                    var post = posts[i];

                    ////////////////////// START - CHECK IF ITS WITHIN VIEW ///////////////////////////////
                    var location = angular.fromJson(post.location);
                    var googleLoc = new google.maps.LatLng(location.lat, location.lon);

                    updateBounds();
                    if (!(googleLoc.lat() < current_map_nw.lat()) ||
                        !(googleLoc.lat() > current_map_se.lat()) ||
                        !(googleLoc.lng() < current_map_se.lng()) ||
                        !(googleLoc.lng() > current_map_nw.lng()) )
                    {
                        continue; // skip this post - no need to draw
                    }
                    ////////////////////// END - CHECK IF ITS WITHIN VIEW ///////////////////////////////


                    ////////////////////// START - CHECK WE HAVE TO REDRAW ///////////////////////////////
                    // if the markers post is exisiting one, we don't want to draw it again.
                    // only draw new ones!
                    for (var j = 0, marker; marker = markersOnMap[j]; j++){

                        //이부분 로직을 다시 짜야함
                        var isAlreadyDrawn = post._id == marker.post._id;
                        if (isAlreadyDrawn) // 이미 그려졌는지 테스트
                        {
                            if (isGuidtgtChanged){
                                unDrawPost(post._id);
                                break;
                            } else if (marker.post.guidtgt == post.guidtgt){  // 이미 그려진것중, guidtgt이 바뀌었는가
                                post = null; // 이미 그려진 포스트라면, null로.
                                break; // 이 loop은 post._id만 검사용임으로, 만약 겹치면 바로 loop을 멈춰도 괜찮다.}
                            } else {
                                unDrawPost(post._id);
                                break;
                            }
                        }
                    }

                    if (post == null){
                        continue; // skip this post - no need to draw
                    }
                    ////////////////////// END - CHECK WE HAVE TO REDRAW ///////////////////////////////


                    ////////////////////// START - DRAWING POST ///////////////////////////////
                    // marker option setting
                    var markerOptions = {
                        position: googleLoc,
                        map: map,
                        title: "Bubble",
                        icon: imagePost
                    };
                    var marker = new google.maps.Marker(markerOptions);
                    // add marker to array, this means that it has been drawn to map
                    markersOnMap.push(
                        {
                            marker: marker,
                            post  : post
                        });

                    ////////////////////// START - DRAWING MESSAGE WINDOW ///////////////////////////////
                    var coupling_status = calculateCoupling(post.guid, post.guidtgt);

                    //console.log("post.isLocal", post.islocal);
                    var local_status = post.islocal;

                    // 스코프에서부터 새로운 차일드 스코프를 만들어 each for loop에서 사용한다.
                    // --> 해야, 각 DOM이 각각의 scope를 가져서 post msg가 안 겹친다.
                    var parent = scope;
                    var child = parent.$new(true);

                    var openInfoWindow = (function(marker, child_scope, post, coupling_status, local_status){

                        return function(){
                            // create new window
                            var infoWindowOptions = {
                                pixelOffset: new google.maps.Size(-39.5, 16.0),
                                disableAutoPan: true
                            };
                            var infoWindow = new google.maps.InfoWindow(infoWindowOptions);

                            // get current time and subtract it from post's end time.
                            // that will be accurate post time for instant posts and long posts.
                            var currentDate      = new Date();
                            var currentTimeMilli = currentDate.getTime();
                            var postlife         = ((post.lifeend - currentTimeMilli) >= 0) ? (post.lifeend - currentTimeMilli) : 0;

                            var lifepercentage = (postlife / post.lifespan).toFixed(2)

                            //to make data available to template
                            child_scope.msg                = post.body;
                            child_scope.postlife           = postlife;
                            child_scope.postguid           = post.guid;
                            child_scope.postguidtgt        = post.guidtgt;
                            child_scope.postcouplestatus   = coupling_status;
                            child_scope.postlifepercentage = lifepercentage;
                            child_scope.postlocalstatus    = local_status;

                            /*
                            // this enables changing coupling value instantly.
                            child_scope.$on('set:coupling', function(_, coupling_update){
                                child_scope.postcouplestatus = coupling_update;
                            });
                            */

                            // compile it before loaded
                            var content  = '<div map-msg></div>';
                            var compiled = $compile(content)(child_scope);

                            infoWindow.setContent( compiled[0] );

                            google.maps.event.addListener(infoWindow,'closeclick',function(){
                                if (post.guid == scope.guid){
                                   swal(
                                    {   
                                        title: "Are you sure?",   
                                        text: "You will not be able to recover this imaginary file!",   
                                        type: "warning",   
                                        showCancelButton: true,   
                                        confirmButtonColor: "#DD6B55",   
                                        confirmButtonText: "Yes, delete it!",   
                                        closeOnConfirm: false 
                                    }, 
                                    function(isConfirm){
                                        if (isConfirm){
                                            PostsSvc.remove(post)
                                            .success(function(res){
                                                // handle success
                                            })
                                            .catch(function(err){
                                                // handle error
                                            });

                                            swal("Deleted!", "Your imaginary file has been deleted.", "success");
                                        } else {
                                            var currentDate      = new Date();
                                            var currentTimeMilli = currentDate.getTime();
                                            var postlife         = ((post.lifeend - currentTimeMilli) >= 0) ? (post.lifeend - currentTimeMilli) : 0;
                                            var lifepercentage = (postlife / post.lifespan).toFixed(2)

                                            if (lifepercentage > 0){
                                                child_scope.postlifepercentage = lifepercentage;
                                                infoWindow.open(map , marker);
                                            }
                                        }
                                        
                                    }); 
                                }

                            });


                            infoWindow.open(map , marker);
                        };
                    })(marker, child, post, coupling_status, local_status);
                    
                    openInfoWindow();
                    ////////////////////// END - DRAWING MESSAGE WINDOW ///////////////////////////////

                    ////////////////////// END - DRAWING POST ///////////////////////////////

                } // end of for-loop
            }

            PostsSvc.fetch()
            .success(drawPosts) 
            .catch(function(err){
                // handle error
            });

            // end of post fetch success
        }

        function drawDropDown(location)
        {
            var googleLoc = new google.maps.LatLng(location.lat, location.lon);

            updateBounds();
            // 바운더리 안에 있는지부터 체크를 하장
            if (!(googleLoc.lat() < current_map_nw.lat()) ||
                !(googleLoc.lat() > current_map_se.lat()) ||
                !(googleLoc.lng() < current_map_se.lng()) ||
                !(googleLoc.lng() > current_map_nw.lng()) )
            {
                return; // skip this post - no need to draw
            }

            // marker option setting
            var markerOptions = {
                position: googleLoc,
                map: map,
                animation: google.maps.Animation.DROP,
                title: "UserPin",
                icon: imageUserLogin
            };

            var marker = new google.maps.Marker(markerOptions);

            $timeout(
                (function(old_marker){
                    return function(){
                        old_marker.setMap(null);
                    };
                }(marker)), 
            2000);
        }

        function unDrawPost(postid)
        {
            //console.log("starting remove post");
            for (var k = 0, marker; marker = markersOnMap[k]; k++) {
                //console.log(postid);
                //console.log(marker.post._id);
                if (postid == marker.post._id) {
                    marker.marker.setMap(null);
                    markersOnMap.splice(k, 1);
                    break;
                }
            }
        }

        function drawAndSetPlace(location)
        {
            var googleLoc = new google.maps.LatLng(location.lat, location.lon);
            drawHelperMarker(googleLoc);
            setPlace(googleLoc);

            // make sure server gets updated whenever setting new place with marker
            updateWatchLocation();
        }

        // draw map with helper markers
        function drawHelperMarker(location){
            for (var i = 0, marker; marker = helperMarkers[i]; i++) {
                marker.setMap(null);
            }
            helperMarkers = [];
            var marker = new google.maps.Marker({
                position: location, 
                map: map,
                icon: imageTarget
            });
            helperMarkers.push(marker);
        }

        function unDrawHelperMarker(){
            for (var i = 0, marker; marker = helperMarkers[i]; i++) {
                marker.setMap(null);
            }
            helperMarkers = [];
        }


        //------------------------------------------------------------------------------------
        // UTIL
        //------------------------------------------------------------------------------------
        function setPlace(location)
        {
            // broadcast location infor(lon,lat)
            scope.$emit('set:loc', location);

            var geocoder = new google.maps.Geocoder();

            // broadcast place formatted_address and draw icon
            geocoder.geocode( { 'latLng': location }, function(results, status) {
                // as user clicks on the map,
                // we have to save the formatted address in $scope and
                // it will be used through posts.ctrl
                // emit broadcase 'place' and send this to application.ctrl
                try {
                    // broadcast formatted_address
                    scope.$emit('set:place', results[1].formatted_address); 
                }
                catch(err) {
                    //console.log(err);
                    swal("","Location does not exists");
                    scope.$emit('set:place', "Location does not exists");
                }
            });
        }

        function calculateCoupling(post_guid, post_guidtgt)
        {
            /* coupling status
                0 - no status
                1 - i like you
                2 - you like i
                4 - we like each other // disabled.
            */

            var isPointingYou     = scope.guidtgt == post_guid;
            var isPointingMe      = scope.guid    == post_guidtgt;
            var isMyPost          = scope.guid    == post_guid;
            var isPointingSomeone = scope.guidtgt != '0';

            if (isMyPost && isPointingSomeone)
            {
                return 2; // for my view's my post to be "I like someone"
            }
            else if (isPointingYou && isPointingMe)
            {
                return 4;
            }
            else if (isPointingYou && !isPointingMe)
            {
                return 1;
            }
            else if (!isPointingYou && isPointingMe)
            {
                return 2;
            }
            else
            {
                return 0;
            }
        }

        //------------------------------------------------------------------------------------
        // UI
        //------------------------------------------------------------------------------------
        function setUISearchLocationToggle()
        {
            var mapSearchToggle = (document.getElementById('map-search-toggle'));
            map.controls[google.maps.ControlPosition.TOP_LEFT].push(mapSearchToggle);
        }

        function setUIMoveToCurrLocBtn()
        {
            var currLocBtn = (document.getElementById('map-btn-curr')); 
            map.controls[google.maps.ControlPosition.TOP_RIGHT].push(currLocBtn);
        }

        function setUIPostForm()
        {
            var postForm = (document.getElementById('map-posting')); 
            map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(postForm);
        }

        function setUIPostBtn()
        {
            var postBtn = (document.getElementById('map-btn-submit'));
            map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(postBtn);
        }

        function setUITimeSlider()
        {
            var timeSlider = (document.getElementById('map-time-slider'));
            map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(timeSlider);
        }

        function setUISearchBox()
        {
            // Create the search box and link it to the UI element.
            var input = (document.getElementById('pac-input')); // @type {HTMLInputElement}  
            map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

            var searchBox = new google.maps.places.SearchBox((input)); // @type {HTMLInputElement} 

            // Listen for the event fired when the user selects an item from the
            // pick list. Retrieve the matching places for that item.
            google.maps.event.addListener(searchBox, 'places_changed', function() {
                var places = searchBox.getPlaces();

                if (places.length == 0) {
                  return;
                }

                // take only 1 spot
                var place = places[0];

                // when search happens, location will be updated as well for post
                var location = {
                    lat: place.geometry.location.lat(),
                    lon: place.geometry.location.lng()
                };
                drawAndSetPlace(location);

                window.localStorage.latitude = place.geometry.location.latitude;
                window.localStorage.longitude = place.geometry.location.longitude;

                map.panTo(place.geometry.location);
                map.setZoom(16);
            });
        }

        //------------------------------------------------------------------------------------
        // EVENT
        //------------------------------------------------------------------------------------
        function setEventClick()
        {
            // click event on map to draw X marker and set Post location
            google.maps.event.addListener(map_origin, 'click', function(event) {
                var location = {
                    lat: event.latLng.lat(),
                    lon: event.latLng.lng()
                };
                drawAndSetPlace(location);
            });
        }

        function setEventCenterChanged()
        {
            google.maps.event.addListener(map_origin, 'center_changed', function(){                
                // when map center change, update last location in memory,
                // so browser will remember it next time you come!
                updateDefaultLocation();
            });
        }

        function setEventBoundsChanged()
        {
            google.maps.event.addListener(map_origin, 'bounds_changed', function(){
                // when map center change, update bounds info for map
                updateBounds();  
            });
        }

        function setEventDragEnd()
        {
            google.maps.event.addListener(map_origin, 'dragend', function(){
                // update map as drag end
                updateAndDrawPosts();

                // update watchloc when center changed.
                updateWatchLocation();
            });
        }

        function setEventResize()
        {
            google.maps.event.addListener(map_origin, 'resize', function(){
                // update map as drag end
                updateAndDrawPosts();

                // update watchloc when center changed.
                updateWatchLocation();
            });
        }

        function setEventZoomChanged()
        {
            google.maps.event.addListener(map_origin, 'zoom_changed', function(){
                // update map as drag end
                updateAndDrawPosts();

                // update watchloc when center changed.
                updateWatchLocation();
            });
        }

        //------------------------------------------------------------------------------------
        // SETUP FOR MAP
        //------------------------------------------------------------------------------------
        // map initial configs
        function initialMapData(){
            // if localStorage remembers latest map location, use it,
            if (!isNaN(window.localStorage.latitude) && !isNaN(window.localStorage.longitude))
            {
                initialMapCenter = new google.maps.LatLng(window.localStorage.latitude, window.localStorage.longitude);
            }
            // if there is no latest map location, get current location
            else if (scope.userLocation.lat != 0.0 && scope.userLocation.lon != 0.0) 
            {
                // this may not work for now since location gets set after map is defined.. (TODO: refactor the order)
                initialMapCenter = new google.maps.LatLng(scope.userLocation.lat, scope.userLocation.lon);
            }
            // if none of above works, try to set it to LA (?!)
            else 
            {
                initialMapCenter = new google.maps.LatLng(34.05, -118.24);
            }

            mapOptions = {
                    center      : initialMapCenter,
                    zoom        : 15,
                    scrollwheel : true,
                    streetViewControl: false,
                    mapTypeControl: false,
                    panControl: false,
                    zoomControl: false,
                    mapTypeControlOptions: {
                      mapTypeIds: [google.maps.MapTypeId.ROADMAP, CLOUD_MAP_ID]
                    },
                    mapTypeId: CLOUD_MAP_ID
            };
        }

        function setManualEvents(){
            function CloudMap(options){
                var self = this;
                //console.log("Initializing map");
            }

            // instantiate google map
            map_origin = new google.maps.Map(element[0], mapOptions);

            // set prototype of custom map with origin map
            CloudMap.prototype = map_origin;

            // draw x marker
            function handleDrawXMarker(location){
                google.maps.event.trigger(this, 'drawXMarker', location);
            }
            CloudMap.prototype.drawXMarker = handleDrawXMarker;

            // draw current location marker
            function handleDrawCurrLocationMarker(location){
                google.maps.event.trigger(this, 'drawCurrLocationMarker', location);
            }
            CloudMap.prototype.drawCurrLocationMarker = handleDrawCurrLocationMarker;

            // draw posts
            function handleUpdateAndDrawPosts(){
                google.maps.event.trigger(this, 'updateAndDrawPosts');
            }
            CloudMap.prototype.updateAndDrawPosts = handleUpdateAndDrawPosts;

            // draw responses
            function handleDrawResponses(post){
                google.maps.event.trigger(this, 'drawResponses', post);
            }
            CloudMap.prototype.drawResponses = handleDrawResponses;

            // undraw posts
            function handleUnDrawPost(postid){
                google.maps.event.trigger(this, 'unDrawPost', postid);
            }
            CloudMap.prototype.unDrawPost = handleUnDrawPost;

            // create custom map for app
            map = new CloudMap();

            google.maps.event.addListener(map, 'drawXMarker', function(location){
                drawAndSetPlace(location);
            });

            google.maps.event.addListener(map, 'drawCurrLocationMarker', function(location){
                drawDropDown(location);
            });

            google.maps.event.addListener(map, 'updateAndDrawPosts', function(){
                updateAndDrawPosts();
            });

            google.maps.event.addListener(map, 'drawResponses', function(post){
                drawResponses(post);
            });

            google.maps.event.addListener(map, 'unDrawPost', function(postid){
                unDrawPost(postid);
            });
        }

        function setStyleForMap()
        {
            var featureOpts_day = [{"featureType":"administrative","elementType":"labels.text.fill","stylers":[{"color":"#6195a0"}]},{"featureType":"administrative.province","elementType":"geometry.stroke","stylers":[{"visibility":"off"}]},{"featureType":"landscape","elementType":"geometry","stylers":[{"lightness":"0"},{"saturation":"0"},{"color":"#f5f5f2"},{"gamma":"1"}]},{"featureType":"landscape.man_made","elementType":"all","stylers":[{"lightness":"-3"},{"gamma":"1.00"}]},{"featureType":"landscape.natural.terrain","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"poi","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"poi.park","elementType":"geometry.fill","stylers":[{"color":"#bae5ce"},{"visibility":"on"}]},{"featureType":"road","elementType":"all","stylers":[{"saturation":-100},{"lightness":45},{"visibility":"simplified"}]},{"featureType":"road.highway","elementType":"all","stylers":[{"visibility":"simplified"}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#fac9a9"},{"visibility":"simplified"}]},{"featureType":"road.highway","elementType":"labels.text","stylers":[{"color":"#4e4e4e"}]},{"featureType":"road.arterial","elementType":"labels.text.fill","stylers":[{"color":"#787878"}]},{"featureType":"road.arterial","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"transit","elementType":"all","stylers":[{"visibility":"simplified"}]},{"featureType":"transit.station.airport","elementType":"labels.icon","stylers":[{"hue":"#0a00ff"},{"saturation":"-77"},{"gamma":"0.57"},{"lightness":"0"}]},{"featureType":"transit.station.rail","elementType":"labels.text.fill","stylers":[{"color":"#43321e"}]},{"featureType":"transit.station.rail","elementType":"labels.icon","stylers":[{"hue":"#ff6c00"},{"lightness":"4"},{"gamma":"0.75"},{"saturation":"-68"}]},{"featureType":"water","elementType":"all","stylers":[{"color":"#eaf6f8"},{"visibility":"on"}]},{"featureType":"water","elementType":"geometry.fill","stylers":[{"color":"#c7eced"}]},{"featureType":"water","elementType":"labels.text.fill","stylers":[{"lightness":"-49"},{"saturation":"-53"},{"gamma":"0.79"}]}];

            var featureOpts_night = [{"featureType":"all","elementType":"labels.text.fill","stylers":[{"color":"#ffffff"}]},{"featureType":"all","elementType":"labels.text.stroke","stylers":[{"visibility":"on"},{"color":"#3e606f"},{"weight":2},{"gamma":0.84}]},{"featureType":"all","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"administrative","elementType":"geometry","stylers":[{"weight":0.6},{"color":"#182a3d"},{"visibility":"on"}]},{"featureType":"landscape","elementType":"geometry","stylers":[{"color":"#1a528b"},{"visibility":"simplified"}]},{"featureType":"poi","elementType":"geometry","stylers":[{"color":"#406d80"},{"visibility":"off"}]},{"featureType":"poi.park","elementType":"geometry","stylers":[{"color":"#2c5a71"}]},{"featureType":"road","elementType":"geometry","stylers":[{"color":"#66a9ee"},{"lightness":-37},{"visibility":"on"}]},{"featureType":"road","elementType":"geometry.fill","stylers":[{"visibility":"on"}]},{"featureType":"road","elementType":"geometry.stroke","stylers":[{"visibility":"off"}]},{"featureType":"road.highway","elementType":"geometry","stylers":[{"visibility":"on"}]},{"featureType":"road.highway","elementType":"labels.text","stylers":[{"visibility":"off"}]},{"featureType":"road.local","elementType":"geometry.stroke","stylers":[{"lightness":"-11"}]},{"featureType":"transit","elementType":"geometry","stylers":[{"color":"#ff7e4e"},{"visibility":"simplified"}]},{"featureType":"transit.station.airport","elementType":"geometry","stylers":[{"visibility":"off"}]},{"featureType":"water","elementType":"geometry","stylers":[{"color":"#182a3d"}]}];
            
            // set map depends on daytime or nighttime
            var currentTime = new Date(); // for now
            var currentHour = currentTime.getHours();
            var featureOpts;
            if (currentHour < 4 || currentHour > 19){
                featureOpts = featureOpts_night;
            } else {
                featureOpts = featureOpts_day;
            }

            var styledMapOptions = {
                name: 'Custom Style'
              };

            var customMapType = new google.maps.StyledMapType(featureOpts, styledMapOptions);
            map.mapTypes.set(CLOUD_MAP_ID, customMapType);
        }

        // init the map
        function initMap() {
            if (map === void 0) {
                initialMapData();

                setManualEvents();

                setStyleForMap();
            }

            // add UI elements to map
            setUISearchLocationToggle();
            setUISearchBox();
            setUIMoveToCurrLocBtn();
            setUIPostForm();
            setUIPostBtn();
            setUITimeSlider();

            // add origin native Event handlers to map
            setEventClick();
            setEventCenterChanged();
            setEventDragEnd();
            setEventResize();
            setEventZoomChanged();
            setEventBoundsChanged();

            // broadcast to send map to application ctrl
            scope.$emit('set:map', map);
        } 

        //------------------------------------------------------------------------------------
        // EXECUTE
        //------------------------------------------------------------------------------------
        initMap();

        drawHelperMarker(initialMapCenter);
        setPlace(initialMapCenter);
    };
    
    return {
        restrict: 'A',
        template: '<div id="map-canvas"></div>',
        replace: true,
        link: link
    };
});

