angular.module('app')
.directive('mapMsg', function ($timeout) {
  return {
    restrict: 'A',
    templateUrl: './templates/window.html',
    link: function(scope, elm, attrs) {        

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
        angular.element(document).ready(function() {
          
          updateGuidTarget();

          updatePostTimer();
          
        });

        function updateGuidTarget(){
          // update status for guid target
          var postguid = scope.postguid;
          var myguid = scope.$parent.guid;
          elm.parent().find('div div #bubbleClick').on('click',function(){
            // clicking its own post will do nothing
            if (postguid == myguid){
              return;
            }

            //elm.parent().find('div div #bubbleClick').addClass("bubblePost bubblePost_ilikeyou");
            //scope.$parent.$apply();
            //scope.$parent.$parent.postcouplestatus = 1; // 1- ilikeyou ??

            scope.$emit('set:guidtgt', postguid);
          });
        }

        function updatePostTimer(){
          // set timer for post life bar
          $timeout(function(){
            var duration = scope.postlife + "ms";
            var postlifebar_css = elm.parent().find('div div .postlifebar').css('animation-duration', duration);
          }, 100);
        }
        
    },
  }
});