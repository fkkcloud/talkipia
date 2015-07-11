angular.module('app')
.directive('mapMsg', function ($timeout) {

    var link = function(scope, element, attrs) {        

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
        // as the document gets ready, set click event and lifebar animation length
        var manualClick = false;

        angular.element(document).ready(function() {

          updateGuidTarget();

          $timeout(updatePostTimer, 1);

          $timeout(customizeInfoWindow, 1);

        });

        function updateGuidTarget(){
          // update status for guid target
          var postguid = scope.postguid;
          var myguid = scope.$parent.guid;
          angular.element(element).parent().find('div #iw-container').on('click',function(){
            // clicking its own post will do nothing
            if (postguid == myguid){
              return;
            }

            // this have to be update to be communicated through the server

            if (scope.$parent.guidtgt == 0){
              scope.$emit('set:coupling', 1); // propagate to upper scope for coupling update
              scope.$emit('set:guidtgt', postguid); // propagate to upper scope for guidtgt update
              scope.$apply(); // force to update DOM
            }
            else if (scope.postcouplestatus == 1 && scope.$parent.guidtgt != 0){
              scope.$emit('set:coupling', 0); // propagate to upper scope for coupling update
              scope.$emit('set:guidtgt', 0); // propagate to upper scope for guidtgt update
              scope.$apply(); // force to update DOM
            }
          });
        }

        function updatePostTimer(){
          //console.log("Life %:", scope.postlifepercentage);

            var server_latency = 50; // simulate some latency from server
            var postlife_with_latency = server_latency + scope.postlife;
            var duration = postlife_with_latency + "ms";

            var postlifebar_css = angular.element(element).parent().find('div div .postlifebar').css('-webkit-animation-duration', duration);

            if (scope.postlifepercentage > 0.75){
              /* Chrome, Safari, Opera */
              var postlifebar_css = angular.element(element).parent().find('div div .postlifebar').css('-webkit-animation-name', 'postlifeanim_q_four');
              
              var postlifebar_css = angular.element(element).parent().find('div div .postlifebar').css('animation-name', 'postlifeanim_q_four');
            }
            else if (scope.postlifepercentage <= 0.75 && scope.postlifepercentage > 0.5){
              /* Chrome, Safari, Opera */
              var postlifebar_css = angular.element(element).parent().find('div div .postlifebar').css('-webkit-animation-name', 'postlifeanim_q_three');
              
              var postlifebar_css = angular.element(element).parent().find('div div .postlifebar').css('animation-name', 'postlifeanim_q_three');
            }
            else if (scope.postlifepercentage <= 0.5 && scope.postlifepercentage > 0.20){
              /* Chrome, Safari, Opera */
              var postlifebar_css = angular.element(element).parent().find('div div .postlifebar').css('-webkit-animation-name', 'postlifeanim_q_two');
              
              var postlifebar_css = angular.element(element).parent().find('div div .postlifebar').css('animation-name', 'postlifeanim_q_two');
            }
            else{
              /* Chrome, Safari, Opera */
              var postlifebar_css = angular.element(element).parent().find('div div .postlifebar').css('-webkit-animation-name', 'postlifeanim_q_one');
              
              var postlifebar_css = angular.element(element).parent().find('div div .postlifebar').css('animation-name', 'postlifeanim_q_one');
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

          var iwCloseBtn = iwOuter.next();

          // Apply the desired effect to the close button
          iwCloseBtn.css({
            opacity: '0.6', // by default the close button has an opacity of 0.7
            right: '20px', top: '17px', // button repositioning
          });     
        }
    }

    return {
        restrict: 'A',
        templateUrl: './templates/window.html',
        link: link
    };
});