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
            return "bubblePost bubblePost_couple";
          }
          else if (coupling_status == 1){
            return "bubblePost bubblePost_ilikeyou";
          }
          else if (coupling_status == 2){
            return "bubblePost bubblePost_youlikei";
          }
          else {
            return "bubblePost bubblePost_none";
          }
        };

        //------------------------------------------------------------------------------------
        // DOCUMENT READY
        //------------------------------------------------------------------------------------
        // as the document gets ready, set click event and lifebar animation length
        var manualClick = false;

        angular.element(document).ready(function() {

          updateGuidTarget();

          updatePostTimer();

        });

        function updateGuidTarget(){
          // update status for guid target
          var postguid = scope.postguid;
          var myguid = scope.$parent.guid;
          angular.element(element).parent().find('div div #bubbleClick').on('click',function(){
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
          // set timer for post life bar
          $timeout(function(){
            var duration = scope.postlife + "ms";
            var postlifebar_css = angular.element(element).parent().find('div div .postlifebar').css('animation-duration', duration);
          }, 100);
        }
        
    }

    return {
        restrict: 'A',
        templateUrl: './templates/window.html',
        link: link
    };
});