angular.module('app')
.directive('appMap', function(PostsSvc, UtilSvc, SessionSvc, $compile, $timeout) {
    // directive link function
    var link = function(scope, element, attrs, rootScope) {
        var map;
        var current_map_nw;
        var current_map_se;
        
        var imagePost = {
            url: 'https://catchme.ifyoucan.com/images/pictures/IYC_Icons/IYC_Location_Icon_Small.png',
            size: new google.maps.Size(100, 100),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(17, 34),
            scaledSize: new google.maps.Size(17, 25)
        };

        var imageTarget = {
            url: 'http://www.clker.com/cliparts/U/P/j/M/I/i/x-mark-yellow-md.png',
            size: new google.maps.Size(100, 100),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(17, 34),
            scaledSize: new google.maps.Size(25, 25)
        };

        var imageUserLogin = {
            url: 'http://www.clker.com/cliparts/q/o/2/K/g/V/location-symbol-map-md.png',
            size: new google.maps.Size(100, 100),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(17, 34),
            scaledSize: new google.maps.Size(20, 33)
        };

        var imageListener = {
            url: 'http://2.bp.blogspot.com/-djMa_n5nAEM/T1Gvx_-7-zI/AAAAAAAAAQ4/-1N6lleQvZc/s1600/blinking_dot.gif',
            size: new google.maps.Size(100, 100),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(17, 34),
            scaledSize: new google.maps.Size(17, 17)
        };

        // map style
        var CLOUD_MAP_ID = 'custom_style';
        // 깔끔이 
        //var featureOpts = [{"featureType":"administrative","elementType":"labels.text.fill","stylers":[{"color":"#6195a0"}]},{"featureType":"landscape","elementType":"all","stylers":[{"color":"#f2f2f2"}]},{"featureType":"landscape","elementType":"geometry.fill","stylers":[{"color":"#ffffff"}]},{"featureType":"poi","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"poi.park","elementType":"geometry.fill","stylers":[{"color":"#e6f3d6"},{"visibility":"on"}]},{"featureType":"road","elementType":"all","stylers":[{"saturation":-100},{"lightness":45},{"visibility":"simplified"}]},{"featureType":"road.highway","elementType":"all","stylers":[{"visibility":"simplified"}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#f4d2c5"},{"visibility":"simplified"}]},{"featureType":"road.highway","elementType":"labels.text","stylers":[{"color":"#4e4e4e"}]},{"featureType":"road.arterial","elementType":"geometry.fill","stylers":[{"color":"#f4f4f4"}]},{"featureType":"road.arterial","elementType":"labels.text.fill","stylers":[{"color":"#787878"}]},{"featureType":"road.arterial","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"transit","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"water","elementType":"all","stylers":[{"color":"#eaf6f8"},{"visibility":"on"}]},{"featureType":"water","elementType":"geometry.fill","stylers":[{"color":"#eaf6f8"}]}];
        // 상큼이
        //var featureOpts = [{"featureType":"landscape.man_made","elementType":"geometry","stylers":[{"color":"#f7f1df"}]},{"featureType":"landscape.natural","elementType":"geometry","stylers":[{"color":"#d0e3b4"}]},{"featureType":"landscape.natural.terrain","elementType":"geometry","stylers":[{"visibility":"off"}]},{"featureType":"poi","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"poi.business","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"poi.medical","elementType":"geometry","stylers":[{"color":"#fbd3da"}]},{"featureType":"poi.park","elementType":"geometry","stylers":[{"color":"#bde6ab"}]},{"featureType":"road","elementType":"geometry.stroke","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#ffe15f"}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#efd151"}]},{"featureType":"road.arterial","elementType":"geometry.fill","stylers":[{"color":"#ffffff"}]},{"featureType":"road.local","elementType":"geometry.fill","stylers":[{"color":"black"}]},{"featureType":"transit.station.airport","elementType":"geometry.fill","stylers":[{"color":"#cfb2db"}]},{"featureType":"water","elementType":"geometry","stylers":[{"color":"#a2daf2"}]}];
        // 똑똑이
        //var featureOpts = [{"featureType":"water","elementType":"all","stylers":[{"hue":"#7fc8ed"},{"saturation":55},{"lightness":-6},{"visibility":"on"}]},{"featureType":"water","elementType":"labels","stylers":[{"hue":"#7fc8ed"},{"saturation":55},{"lightness":-6},{"visibility":"off"}]},{"featureType":"poi.park","elementType":"geometry","stylers":[{"hue":"#83cead"},{"saturation":1},{"lightness":-15},{"visibility":"on"}]},{"featureType":"landscape","elementType":"geometry","stylers":[{"hue":"#f3f4f4"},{"saturation":-84},{"lightness":59},{"visibility":"on"}]},{"featureType":"landscape","elementType":"labels","stylers":[{"hue":"#ffffff"},{"saturation":-100},{"lightness":100},{"visibility":"off"}]},{"featureType":"road","elementType":"geometry","stylers":[{"hue":"#ffffff"},{"saturation":-100},{"lightness":100},{"visibility":"on"}]},{"featureType":"road","elementType":"labels","stylers":[{"hue":"#bbbbbb"},{"saturation":-100},{"lightness":26},{"visibility":"on"}]},{"featureType":"road.arterial","elementType":"geometry","stylers":[{"hue":"#ffcc00"},{"saturation":100},{"lightness":-35},{"visibility":"simplified"}]},{"featureType":"road.highway","elementType":"geometry","stylers":[{"hue":"#ffcc00"},{"saturation":100},{"lightness":-22},{"visibility":"on"}]},{"featureType":"poi.school","elementType":"all","stylers":[{"hue":"#d7e4e4"},{"saturation":-60},{"lightness":23},{"visibility":"on"}]}];
        // 초록이
        var featureOpts = [{"featureType":"landscape","stylers":[{"hue":"#FFA800"},{"saturation":0},{"lightness":0},{"gamma":1}]},{"featureType":"road.highway","stylers":[{"hue":"#53FF00"},{"saturation":-73},{"lightness":40},{"gamma":1}]},{"featureType":"road.arterial","stylers":[{"hue":"#FBFF00"},{"saturation":0},{"lightness":0},{"gamma":1}]},{"featureType":"road.local","stylers":[{"hue":"#00FFFD"},{"saturation":0},{"lightness":30},{"gamma":1}]},{"featureType":"water","stylers":[{"hue":"#00BFFF"},{"saturation":6},{"lightness":8},{"gamma":1}]},{"featureType":"poi","stylers":[{"hue":"#679714"},{"saturation":33.4},{"lightness":-25.4},{"gamma":1}]}];
        
        // map config
        var initialMapCenter = new google.maps.LatLng(34.05, -118.24);
        
        if (!isNaN(window.localStorage.latitude) && !isNaN(window.localStorage.longitude))
        {
            initialMapCenter = new google.maps.LatLng(window.localStorage.latitude, window.localStorage.longitude);
        }

        setPlace(initialMapCenter);

        var mapOptions = {
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
            
        // draw map with helper markers
        var helperMarkers = [];
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

        function removeHelperMarker(){
            for (var i = 0, marker; marker = helperMarkers[i]; i++) {
                marker.setMap(null);
            }
            helperMarkers = [];
        }

        function setPlace(location)
        {
            // broadcast location infor(lon,lat)
            scope.$emit('loc', location);

            var geocoder = new google.maps.Geocoder();

            // broadcast place formatted_address and draw icon
            geocoder.geocode( { 'latLng': location }, function(results, status) {
                // as user clicks on the map,
                // we have to save the formatted address in $scope and
                // it will be used through posts.ctrl
                // emit broadcase 'place' and send this to application.ctrl
                try {
                    // broadcast formatted_address
                    scope.$emit('place', results[1].formatted_address); 
                }
                catch(err) {
                    console.log(err);
                    swal("","Location does not exists");
                    scope.$emit('place', "Location does not exists");
                }
            });
        }

        function drawAndSetPlace(location)
        {
            drawHelperMarker(location);
            setPlace(location);
        }

        function calculateCoupling(post_guid, post_guidtgt)
        {
            /* coupling status
                0 - no status
                1 - i like you
                2 - you like i
                4 - we like each other
            */
            var ilikeyou = scope.guidtgt == post_guid;
            var youlikei = scope.guid == post_guidtgt;
            if (ilikeyou && youlikei)
            {
                return 4;
            }
            else if (ilikeyou && !youlikei)
            {
                return 1;
            }
            else if (!ilikeyou && youlikei)
            {
                return 2;
            }
            else
            {
                return 0;
            }
        }

        // update responses such as visualization of listeners
        function updateResponses(){
            SessionSvc.fetch()
            .success(function(sessions){

                for (var i = 0; i < sessions.length; i++){
                    var session = sessions[i];

                    if (session.guid == scope.guid)
                        continue;

                    // session's watch location will be bounced!
                    console.log(session.watchloc);
                    var location = angular.fromJson(session.watchloc);
                    var googleLoc = new google.maps.LatLng(location.lat, location.lon);

                    // marker option setting
                    var markerOptions = {
                        position: googleLoc,
                        map: map,
                        //animation: google.maps.Animation.BOUNCE,
                        title: "UserPin",
                        icon: imageListener,
                        optimized: false
                    };

                    var marker = new google.maps.Marker(markerOptions);

                    setTimeout(
                        (function(old_marker){
                            return function(){
                                old_marker.setMap(null);
                            };
                        }(marker)), 
                    1800);
                }
            });
        }

        function updatePosts(){
            PostsSvc.fetch()
            .success(function(posts){

                // draw latest update
                for (var i = 0; i < posts.length; i++)
                {
                    var post = posts[i];

                    // if the markers post is exisiting one, we don't want to draw it again.
                    // only draw new ones!
                    for (var j = 0, marker; marker = markers[j]; j++){
                        if (post._id == marker.post._id)
                        {
                            post = null; // 이미 그려진 포스트라면, null로.
                            break; // 이 loop은 post._id만 검사용임으로, 만약 겹치면 바로 loop을 멈춰도 괜찮다.
                        }
                    }

                    // post가 원래 있엇던것이면 post가 null로 셋 되었을것이고, location프로퍼티도 있는지 확인하자
                    if (!post || !post.hasOwnProperty('location'))
                        continue; // skip this post - no need to draw

                    var location = angular.fromJson(post.location);
                    var googleLoc = new google.maps.LatLng(location.lat, location.lon);

                    // 바운더리 안에 있는지부터 체크를 하장
                    if (!(googleLoc.lat() < current_map_nw.lat()) ||
                        !(googleLoc.lat() > current_map_se.lat()) ||
                        !(googleLoc.lng() < current_map_se.lng()) ||
                        !(googleLoc.lng() > current_map_nw.lng()) )
                    {
                        continue; // skip this post - no need to draw
                    }

                    var coupling_status = calculateCoupling(post.guid, post.guidtgt);
                    
                    // marker option setting
                    var markerOptions = {
                        position: googleLoc,
                        map: map,
                        title: "Bubble",
                        icon: imagePost
                    };
                    var marker = new google.maps.Marker(markerOptions);
                    
                    // set up self remove for marker itself and from markers collection at front-end
                    setTimeout(
                        (function(old_marker, old_post){
                            return function(){
                                old_marker.setMap(null);
                                for (var k = 0, marker; marker = markers[k]; k++){
                                    if (old_post._id == marker.post._id)
                                    {
                                        markers.splice(k, 1);
                                    }
                                }
                            };
                        }(marker, post)), 
                    post.lifespan);
                    
                    // add marker to array, this means that it has been drawn to map
                    markers.push(
                        {
                            marker: marker,
                            post  : post
                        });

                    ////////////////////// DRAWING MESSAGE WINDOW ///////////////////////////////
                    /*
                    var html = '<div id="bubblePost">' + 
                                post.body + 
                                '</div><div id="bubbleLifeBar"></div>';
                    */

                    // 스코프에서부터 새로운 차일드 스코프를 만들어 each for loop에서 사용한다.
                    // --> 해야, 각 DOM이 각각의 scope를 가져서 post msg가 안 겹친다.
                    var parent = scope;
                    var child = parent.$new(true);

                    var openInfoWindow = (function(marker, child_scope, post, coupling_status){

                        return function(){
                            // create new window
                            var infoWindowOptions = { 
                                pixelOffset: new google.maps.Size(-41.5, 10.0), 
                                disableAutoPan: true
                            };
                            var infoWindow = new google.maps.InfoWindow(infoWindowOptions);

                            // compile it before loaded
                            var content = '<div map-msg></div>';
                            var compiled = $compile(content)(child_scope);

                            //to make data available to template
                            child_scope.msg = post.body;
                            child_scope.postlife = post.lifespan;
                            child_scope.postguid = post.guid;
                            child_scope.postguidtgt = post.guidtgt;
                            child_scope.postcouplestatus = coupling_status;

                            infoWindow.setContent( compiled[0] );
                            infoWindow.open(map , marker);
                        };
                    })(marker, child, post, coupling_status);
                    
                    openInfoWindow();
                    ////////////////////// END of DRAWING MESSAGE WINDOW ///////////////////////////////

                } // end of for-loop
            });
        }

        // place a marker and infoWindow
        var markers = [];
        function updateMap() { 
            updatePosts();
        }

        function setMoveToCurrLocBtn()
        {
            var currLocBtn = (document.getElementById('btn-curr')); 
            map.controls[google.maps.ControlPosition.TOP_RIGHT].push(currLocBtn);
        }

        function setPostForm()
        {
            var postForm = (document.getElementById('posting')); 
            map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(postForm);
        }

        function setPostBtn()
        {
            var postBtn = (document.getElementById('btn-submit'));
            map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(postBtn);
        }

        function setSearchBox()
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
                // scope.$emit('place', place.formatted_address);
                drawAndSetPlace(place.geometry.location);

                window.localStorage.latitude = place.geometry.location.latitude;
                window.localStorage.longitude = place.geometry.location.longitude;

                map.panTo(place.geometry.location);
                map.setZoom(16);
            });
        }

        function setClickMap()
        {
            // click event on map to draw marker
            google.maps.event.addListener(map, 'click', function(event) {
                drawAndSetPlace(event.latLng);
            });
        }

        function setMoveToCurrentLocation()
        {
            // moving to a user's location and draw a marker there
            google.maps.event.addListener(map, 'heading_changed', function(options) {
                if (options.type == 'curr_x')
                {
                    drawAndSetPlace(options.location);
                }
                else if (options.type == 'curr_loc')
                {
                    drawDropDown(options.location);
                }
            });
        }

        function setCenterChanged()
        {
            google.maps.event.addListener(map, 'center_changed', function(){
                // when map center change, update last location in memory,
                // so browser will remember it next time you come!
                window.localStorage.latitude = map.getCenter().lat();
                window.localStorage.longitude = map.getCenter().lng();

                // when map center change, update bounds info for map
                updateBounds();
            })
        }

        function setMapDragEnd()
        {
            google.maps.event.addListener(map, 'dragend', function(){
                // update watchloc when center changed.
                updateWatchLocation();

                // update map as drag end
                updateMap();
            })
        }
        
        /* usage
            meant to implement manually updating elements
            google.maps.event.trigger($scope.map, 'maptypeid_changed'); // regular update
            google.maps.event.trigger($scope.map, 'maptypeid_changed', options); // update with options
        */
        function setLoadPostMarkers()
        {
            // manually reload/refresh markers
            google.maps.event.addListener(map, 'maptypeid_changed', function(options) {
                if (options == null) // if there is no options, just update map
                {
                    removeHelperMarker();
                    updateMap();
                }
                else if (options.type == 'res_login') // option for response
                {
                    showLogin(options.data);
                }
                else if (options.type == 'res_post') // option for response
                {
                    updateResponses();
                }
                
            });
        }

        function updateWatchLocation()
        {
            var watchloc = {
                lat: map.getCenter().lat(),
                lon: map.getCenter().lng()
            }

            var watchlocJSON = JSON.stringify(watchloc);

            var updatedsession = {
                watchloc: watchlocJSON,
                guid: scope.guid
            };

            // update watchloc when center changed.
            SessionSvc.update(updatedsession);
        }

        function drawDropDown(googleLoc)
        {
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

            setTimeout(
                (function(old_marker){
                    return function(){
                        old_marker.setMap(null);
                    };
                }(marker)), 
            2000);
        }

        function showLogin(session)
        {
            var location = angular.fromJson(session.location);
            var googleLoc = new google.maps.LatLng(location.lat, location.lon);

            drawDropDown(googleLoc);
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

        // init the map
        function initMap() {
            if (map === void 0) {
                map = new google.maps.Map(element[0], mapOptions);

                var styledMapOptions = {
                    name: 'Custom Style'
                  };

                var customMapType = new google.maps.StyledMapType(featureOpts, styledMapOptions);
                map.mapTypes.set(CLOUD_MAP_ID, customMapType);
            }

            setLoadPostMarkers();

            // broadcast to send map to application ctrl
            scope.$emit('mapInit', map);

            setClickMap();

            setSearchBox();

            setMoveToCurrLocBtn();

            setPostForm();

            setPostBtn();

            setCenterChanged();

            setMoveToCurrentLocation();

            setMapDragEnd();

            updateMap();

            $timeout(function(){
                updateBounds();
            }, 800);
            
        } 

        initMap();
    };
    
    return {
        restrict: 'A',
        template: '<div id="map-canvas"></div>',
        replace: true,
        link: link
    };
});

