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

            SessionSvc.fetch()
            .success(function(sessions){

                for (var i = 0; i < sessions.length; i++){
                    var session = sessions[i];

                    // skip my session - no need to draw 내 자신의 세션은 그릴필요가 없다.
                    if (session.guid == scope.guid)
                        continue;

                     // session's watch location will be bounced!
                    //console.log('session watch location:', session.watchloc);
                    //console.log('post location:', post.location);
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
                        anchor: new google.maps.Point(10, 10),
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
            });
        }

        function updateAndDrawPosts(){
            
            // for checking local posts - isPointingYou
            isGuidtgtChanged = prevGuidtgt != scope.guidtgt; // see if my guidtgt has changed;
            prevGuidtgt = scope.guidtgt; // update previous guidtgt

            //var guidObj = {guid: scope.guid} // for socket fetch optimization TODO
            PostsSvc.fetch()
            .success(function(posts){

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
                                            PostsSvc.remove(post);
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
            }); // end of post fetch success
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
                    console.log(err);
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
            initialMapCenter = new google.maps.LatLng(34.05, -118.24);
        
            if (!isNaN(window.localStorage.latitude) && !isNaN(window.localStorage.longitude))
            {
                initialMapCenter = new google.maps.LatLng(window.localStorage.latitude, window.localStorage.longitude);
            }

            setPlace(initialMapCenter);

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
            // 깔끔이 
            //var featureOpts = [{"featureType":"administrative","elementType":"labels.text.fill","stylers":[{"color":"#6195a0"}]},{"featureType":"landscape","elementType":"all","stylers":[{"color":"#f2f2f2"}]},{"featureType":"landscape","elementType":"geometry.fill","stylers":[{"color":"#ffffff"}]},{"featureType":"poi","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"poi.park","elementType":"geometry.fill","stylers":[{"color":"#e6f3d6"},{"visibility":"on"}]},{"featureType":"road","elementType":"all","stylers":[{"saturation":-100},{"lightness":45},{"visibility":"simplified"}]},{"featureType":"road.highway","elementType":"all","stylers":[{"visibility":"simplified"}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#f4d2c5"},{"visibility":"simplified"}]},{"featureType":"road.highway","elementType":"labels.text","stylers":[{"color":"#4e4e4e"}]},{"featureType":"road.arterial","elementType":"geometry.fill","stylers":[{"color":"#f4f4f4"}]},{"featureType":"road.arterial","elementType":"labels.text.fill","stylers":[{"color":"#787878"}]},{"featureType":"road.arterial","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"transit","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"water","elementType":"all","stylers":[{"color":"#eaf6f8"},{"visibility":"on"}]},{"featureType":"water","elementType":"geometry.fill","stylers":[{"color":"#eaf6f8"}]}];
            // 상큼이
            //var featureOpts = [{"featureType":"landscape.man_made","elementType":"geometry","stylers":[{"color":"#f7f1df"}]},{"featureType":"landscape.natural","elementType":"geometry","stylers":[{"color":"#d0e3b4"}]},{"featureType":"landscape.natural.terrain","elementType":"geometry","stylers":[{"visibility":"off"}]},{"featureType":"poi","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"poi.business","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"poi.medical","elementType":"geometry","stylers":[{"color":"#fbd3da"}]},{"featureType":"poi.park","elementType":"geometry","stylers":[{"color":"#bde6ab"}]},{"featureType":"road","elementType":"geometry.stroke","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#ffe15f"}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#efd151"}]},{"featureType":"road.arterial","elementType":"geometry.fill","stylers":[{"color":"#ffffff"}]},{"featureType":"road.local","elementType":"geometry.fill","stylers":[{"color":"black"}]},{"featureType":"transit.station.airport","elementType":"geometry.fill","stylers":[{"color":"#cfb2db"}]},{"featureType":"water","elementType":"geometry","stylers":[{"color":"#a2daf2"}]}];
            // 똑똑이
            var featureOpts = [{"featureType":"water","elementType":"all","stylers":[{"hue":"#7fc8ed"},{"saturation":55},{"lightness":-6},{"visibility":"on"}]},{"featureType":"water","elementType":"labels","stylers":[{"hue":"#7fc8ed"},{"saturation":55},{"lightness":-6},{"visibility":"off"}]},{"featureType":"poi.park","elementType":"geometry","stylers":[{"hue":"#83cead"},{"saturation":1},{"lightness":-15},{"visibility":"on"}]},{"featureType":"landscape","elementType":"geometry","stylers":[{"hue":"#f3f4f4"},{"saturation":-84},{"lightness":59},{"visibility":"on"}]},{"featureType":"landscape","elementType":"labels","stylers":[{"hue":"#ffffff"},{"saturation":-100},{"lightness":100},{"visibility":"off"}]},{"featureType":"road","elementType":"geometry","stylers":[{"hue":"#ffffff"},{"saturation":-100},{"lightness":100},{"visibility":"on"}]},{"featureType":"road","elementType":"labels","stylers":[{"hue":"#bbbbbb"},{"saturation":-100},{"lightness":26},{"visibility":"on"}]},{"featureType":"road.arterial","elementType":"geometry","stylers":[{"hue":"#ffcc00"},{"saturation":100},{"lightness":-35},{"visibility":"simplified"}]},{"featureType":"road.highway","elementType":"geometry","stylers":[{"hue":"#ffcc00"},{"saturation":100},{"lightness":-22},{"visibility":"on"}]},{"featureType":"poi.school","elementType":"all","stylers":[{"hue":"#d7e4e4"},{"saturation":-60},{"lightness":23},{"visibility":"on"}]}];
            // 초록이
            //var featureOpts = [{"featureType":"landscape","stylers":[{"hue":"#FFA800"},{"saturation":0},{"lightness":0},{"gamma":1}]},{"featureType":"road.highway","stylers":[{"hue":"#53FF00"},{"saturation":-73},{"lightness":40},{"gamma":1}]},{"featureType":"road.arterial","stylers":[{"hue":"#FBFF00"},{"saturation":0},{"lightness":0},{"gamma":1}]},{"featureType":"road.local","stylers":[{"hue":"#00FFFD"},{"saturation":0},{"lightness":30},{"gamma":1}]},{"featureType":"water","stylers":[{"hue":"#00BFFF"},{"saturation":6},{"lightness":8},{"gamma":1}]},{"featureType":"poi","stylers":[{"hue":"#679714"},{"saturation":33.4},{"lightness":-25.4},{"gamma":1}]}];
            
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

            // broadcast to send map to application ctrl
            scope.$emit('set:map', map);

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

            // update very first time for app
            $timeout(function(){
                updateDefaultLocation();
                updateBounds();
                updateWatchLocation();
                updateAndDrawPosts();
            }, 800);
        } 

        //------------------------------------------------------------------------------------
        // EXECUTE
        //------------------------------------------------------------------------------------
        initMap();
    };
    
    return {
        restrict: 'A',
        template: '<div id="map-canvas"></div>',
        replace: true,
        link: link
    };
});

