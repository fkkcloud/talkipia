angular.module('app')
.directive('mapMsg', function ($timeout, SessionSvc, PostsSvc) {

    var link = function(scope, element, attrs) {   

        scope.get_localstatus = function(local_status){
          if (local_status)
            return "local-text";
          else
            return "non-local-text";
        };     

        //------------------------------------------------------------------------------------
        // COUPLING CLASS
        //------------------------------------------------------------------------------------
        /* coupling status
          0 - no status
          1 - i like you
          2 - you like i
          4 - we like each other
        */
        scope.get_coupling = function(coupling_status){
          
          if (coupling_status == 4){
            return "coupling coupling-couple";
          }
          else if (coupling_status == 1){
            return "coupling coupling-ilikeyou";
          }
          else if (coupling_status == 2){
            return "coupling coupling-youlikei";
          }
          else {
            return "coupling coupling-none";
          }
        };

        //------------------------------------------------------------------------------------
        // DOCUMENT READY
        //------------------------------------------------------------------------------------
        angular.element(document).ready(function() {

          $timeout(updateGuidTarget, 100);

          $timeout(updatePostTimer, 10);

          $timeout(customizeInfoWindow, 10);

          $timeout(customizeCloseBtn, 10);

          //console.log("post local status:", scope.postlocalstatus);
        });

        function updateGuidTarget(){
          // update status for guid target
          var postguid  = scope.postguid;
          var myguid    = scope.$parent.guid;
          var myguidtgt = scope.$parent.guidtgt;

          element.children().on('click',function(){

            var update_guidtgt = postguid;

            // clicking my message window
            // if its on coupling, break it!
            if (postguid == myguid){
              if (scope.$parent.guidtgt != '0'){
                update_guidtgt = '0'; 
              }
              else {
                return;
              }
            }

            // cliking the one that I liked
            // to dislike the message window
            if (postguid == myguidtgt) {
              update_guidtgt = '0';
            }

            // propagate to upper scope for guidtgt update
            scope.$emit('set:guidtgt', update_guidtgt); 

            // update session information of mine so my session tells me that,
            // I like this guid at this moment in server db
            SessionSvc.updateCoupling(myguid, update_guidtgt)
              .then(function(doc){
                  //console.log("Successfully udpated coupling", doc);
              })
            
            // update my post's guidtgt to be this post's guid in server db
            // this update is for the people who are looking at my posts
            var updates = {
              guid    : myguid,
              guidtgt : update_guidtgt
            };
            PostsSvc.updateGuidtgt(updates)
              .then(function(doc){
                  //console.log("Successfully udpated post's guidtgt", doc);
                  // after coupling update, map has to be updates as well
              })

            /*
            // MIGHT HAVE TO COME BACK FOR OPTIMIZATION
            // this have to be update to be communicated through the server
            if (scope.$parent.guidtgt == 0){
              scope.$emit('set:coupling', 1); // propagate to upper scope for coupling update
              scope.$apply(); // force to update DOM
            }
            else if (scope.postcouplestatus == 1 && scope.$parent.guidtgt != 0){
              scope.$emit('set:coupling', 0); // propagate to upper scope for coupling update
              scope.$apply(); // force to update DOM
            }
            */
            

          });
        }

        function updatePostTimer(){
          //console.log("Life %:", scope.postlifepercentage);
            var duration = scope.postlife + "ms";

            var postbarlife = element.children().children(".postlifebar");

            postbarlife.css('-o-animation-duration', duration);
            postbarlife.css('-moz-animation-duration', duration);
            postbarlife.css('-ms-animation-duration', duration);
            postbarlife.css('-webkit-animation-duration', duration);
            postbarlife.css('animation-duration', duration);

            if (scope.postlifepercentage > 0.95){
              /* Chrome, Safari, Opera */
              postbarlife.css('-o-animation-name', 'postlifeanim_a');
              postbarlife.css('-moz-animation-name', 'postlifeanim_a');
              postbarlife.css('-ms-animation-name', 'postlifeanim_a');
              postbarlife.css('-webkit-animation-name', 'postlifeanim_a');
              postbarlife.css('animation-name', 'postlifeanim_a');
            }
            else if (scope.postlifepercentage <= 0.95 && scope.postlifepercentage > 0.9){
              /* Chrome, Safari, Opera */
              postbarlife.css('-o-animation-name', 'postlifeanim_b');
              postbarlife.css('-moz-animation-name', 'postlifeanim_b');
              postbarlife.css('-ms-animation-name', 'postlifeanim_b');
              postbarlife.css('-webkit-animation-name', 'postlifeanim_b');
              postbarlife.css('animation-name', 'postlifeanim_b');
            }
            else if (scope.postlifepercentage <= 0.9 && scope.postlifepercentage > 0.85){
              /* Chrome, Safari, Opera */
              postbarlife.css('-o-animation-name', 'postlifeanim_c');
              postbarlife.css('-moz-animation-name', 'postlifeanim_c');
              postbarlife.css('-ms-animation-name', 'postlifeanim_c');
              postlifebar_css = postbarlife.css('-webkit-animation-name', 'postlifeanim_c');
              postlifebar_css = postbarlife.css('animation-name', 'postlifeanim_c');
            }
            else if (scope.postlifepercentage <= 0.85 && scope.postlifepercentage > 0.75){
              /* Chrome, Safari, Opera */
              postbarlife.css('-o-animation-name', 'postlifeanim_d');
              postbarlife.css('-moz-animation-name', 'postlifeanim_d');
              postbarlife.css('-ms-animation-name', 'postlifeanim_d');
              postbarlife.css('-webkit-animation-name', 'postlifeanim_d');
              postbarlife.css('animation-name', 'postlifeanim_d');
            }
            else if (scope.postlifepercentage <= 0.75 && scope.postlifepercentage > 0.6){
              /* Chrome, Safari, Opera */
              postbarlife.css('-o-animation-name', 'postlifeanim_e');
              postbarlife.css('-moz-animation-name', 'postlifeanim_e');
              postbarlife.css('-ms-animation-name', 'postlifeanim_e');
              postbarlife.css('-webkit-animation-name', 'postlifeanim_e');
              postbarlife.css('animation-name', 'postlifeanim_e');
            }
            else if (scope.postlifepercentage <= 0.6 && scope.postlifepercentage > 0.5){
              /* Chrome, Safari, Opera */
              postbarlife.css('-o-animation-name', 'postlifeanim_f');
              postbarlife.css('-moz-animation-name', 'postlifeanim_f');
              postbarlife.css('-ms-animation-name', 'postlifeanim_f');
              postbarlife.css('-webkit-animation-name', 'postlifeanim_f');
              postbarlife.css('animation-name', 'postlifeanim_f');
            }
            else if (scope.postlifepercentage <= 0.5 && scope.postlifepercentage > 0.3){
              /* Chrome, Safari, Opera */
              postbarlife.css('-o-animation-name', 'postlifeanim_g');
              postbarlife.css('-moz-animation-name', 'postlifeanim_g');
              postbarlife.css('-ms-animation-name', 'postlifeanim_g');
              postbarlife.css('-webkit-animation-name', 'postlifeanim_g');
              postbarlife.css('animation-name', 'postlifeanim_g');
            }
            else if (scope.postlifepercentage <= 0.3 && scope.postlifepercentage > 0.2){
              /* Chrome, Safari, Opera */
              postbarlife.css('-o-animation-name', 'postlifeanim_h');
              postbarlife.css('-moz-animation-name', 'postlifeanim_h');
              postbarlife.css('-ms-animation-name', 'postlifeanim_h');
              postbarlife.css('-webkit-animation-name', 'postlifeanim_h');
              postbarlife.css('animation-name', 'postlifeanim_h');
            }
            else if (scope.postlifepercentage <= 0.2 && scope.postlifepercentage > 0.1){
              /* Chrome, Safari, Opera */
              postbarlife.css('-o-animation-name', 'postlifeanim_i');
              postbarlife.css('-moz-animation-name', 'postlifeanim_i');
              postbarlife.css('-ms-animation-name', 'postlifeanim_i');
              postbarlife.css('-webkit-animation-name', 'postlifeanim_i');
              postbarlife.css('animation-name', 'postlifeanim_i');
            }
            else{
              /* Chrome, Safari, Opera */
              postbarlife.css('-o-animation-name', 'postlifeanim_j');
              postbarlife.css('-moz-animation-name', 'postlifeanim_j');
              postbarlife.css('-ms-animation-name', 'postlifeanim_j');
              postbarlife.css('-webkit-animation-name', 'postlifeanim_j');
              postbarlife.css('animation-name', 'postlifeanim_j');
            }
        }

        function customizeInfoWindow(){
          // Reference to the DIV that wraps the bottom of infowindow
          var iwOuter = $('.gm-style-iw');
          
          var iwBackground = iwOuter.prev();

          // Remove the background shadow DIV
           iwBackground.children(':nth-child(2)').css({'display' : 'none'});

           // Remove the white background DIV
           iwBackground.children(':nth-child(4)').css({'display' : 'none'});

          // Changes the desired tail shadow color.
          iwBackground.children(':nth-child(3)').find('div').children().css({
            'box-shadow': '0 1px 6px rgba(178, 178, 178, 0.6)', 
            'z-index' : '1',
            'border': '0px'});
        }

        function customizeCloseBtn(){
          // Reference to the DIV that wraps the bottom of infowindow
          var iwOuter = $('.gm-style-iw');

          var iwCloseBtn = iwOuter.next();

          /*
          console.log("postlocal leanth:", iwOuter.parent().find('#postlocal').length);
          if (scope.postlocalstatus == false && 0 == iwOuter.parent().find('#postlocal').length){
            iwCloseBtn.after("<img id='postlocal' src='http://cdn-img.easyicon.net/png/24/2440.png' width='20', height='20'/>");
          }
          */

          // Apply the desired effect to the close button
          iwCloseBtn.css({
            opacity: '0.8', // by default the close button has an opacity of 0.7
            right: '20px', top: '20px', // button repositioning
          }); 
        }
    }

    return {
        restrict: 'A',
        templateUrl: './templates/window.html',
        link: link
    };
});