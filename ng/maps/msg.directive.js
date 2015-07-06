angular.module('app')
.directive('mapMsg', function ($timeout) {
  return {
    restrict: 'A',
    templateUrl: './templates/window.html',
    link: function(scope, elm, attrs) {        

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

        // as the document gets ready, set click event and lifebar animation length
        angular.element(document).ready(function() {
          var postguid = scope.postguid;
          var myguid = scope.$parent.guid;
          elm.parent().find('div div #bubbleClick').on('click',function(){

            console.log('window clicked.');

            // clicking its own post will do nothing
            if (postguid == myguid){
              return;
            }

            scope.$parent.postcouplestatus = 1; // 1- ilikeyou

            console.log('emit set:guidtgt', postguid);
            scope.$emit('set:guidtgt', postguid);
          });

          var duration = scope.postlife + "ms";
          var postlifebar_css = elm.parent().find('div div .postlifebar').css('animation-duration', duration);
        });
        
    },
  }
});