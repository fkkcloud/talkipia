
angular.module('app')
.directive('appMap', function(PostsSvc, UtilSvc, $compile, $timeout) {
    // directive link function
    var link = function(scope, element, attrs) {
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

        // map config
        console.log('window.localStorage.latitude ', window.localStorage.latitude );

        var initialMapCenter = new google.maps.LatLng(34.05, -118.24);
        
        if (!isNaN(window.localStorage.latitude) && !isNaN(window.localStorage.longitude))
        {
            initialMapCenter = new google.maps.LatLng(window.localStorage.latitude, window.localStorage.longitude);
        }

        console.log('window.localStorage.latitude ', window.localStorage.latitude );
        
        console.log(initialMapCenter);

        var mapOptions = {
                center      : initialMapCenter,
                zoom        : 15,
                MapTypeId   : google.maps.MapTypeId.ROADMAP,
                scrollwheel : false,
                streetViewControl: false,
                mapTypeControl: false,
                panControl: false,
                //zoomControl: false
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

        function drawAndSetPlace(location)
        {
            var geocoder = new google.maps.Geocoder();
            
            // broadcast location infor(lon,lat)
            scope.$emit('loc', location);

            drawHelperMarker(location);

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

        // place a marker and infoWindow
        var markers = [];
        function updateMap() {   
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

                    var openInfoWindow = (function(marker, scope, postmsg, postlife){

                        return function(){
                            // create new window
                            var infoWindowOptions = { 
                                pixelOffset: new google.maps.Size(-41.5, 10.0), 
                            };
                            var infoWindow = new google.maps.InfoWindow(infoWindowOptions);

                            // compile it before loaded
                            var content = '<div map-msg></div>';
                            var compiled = $compile(content)(scope);

                            //to make data available to template
                            scope.msg = postmsg;
                            scope.postlife = postlife;

                            infoWindow.setContent( compiled[0] );
                            infoWindow.open(map , marker);
                        };
                    })(marker, child, post.body, post.lifespan);
                    
                    openInfoWindow();
                    ////////////////////// END of DRAWING MESSAGE WINDOW ///////////////////////////////

                } // end of for-loop
            });
        }

        function setSearchBox()
        {
            // Create the search box and link it to the UI element.
            var input = (document.getElementById('pac-input')); // @type {HTMLInputElement}  
            var currLocBtn = (document.getElementById('btn-curr'));      
            map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
            map.controls[google.maps.ControlPosition.TOP_RIGHT].push(currLocBtn);

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
            // moving to a post's location and draw a marker there
            google.maps.event.addListener(map, 'heading_changed', function(location) {
                drawAndSetPlace(location);
            });
        }

        function setCenterChanged()
        {
            google.maps.event.addListener(map, 'center_changed', function(){
                window.localStorage.latitude = map.getCenter().lat();
                window.localStorage.longitude = map.getCenter().lng();

                updateBounds();
            })
        }

        function setMapDragEnd()
        {
            google.maps.event.addListener(map, 'dragend', function(){
                updateMap();
            })
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
        
        function setLoadPostMarkers()
        {
            // manually reload markers / REFRESH
            google.maps.event.addListener(map, 'maptypeid_changed', function() {
                removeHelperMarker();
                updateMap();
            });
        }

        // init the map
        function initMap() {
            if (map === void 0) {
                map = new google.maps.Map(element[0], mapOptions);
            }

            setLoadPostMarkers();

            // broadcast to send map to application ctrl
            scope.$emit('mapInit', map);

            setClickMap();

            setSearchBox();

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

