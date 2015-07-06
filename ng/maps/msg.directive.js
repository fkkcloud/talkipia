angular.module('app')
.directive('mapMsg', function ($timeout) {
  return {
    restrict: 'A',
    templateUrl: './templates/window.html',
    link: function(scope, attrs) {        
        var duration = scope.postlife + "ms";
        var postguid = scope.postguid;
        var msg = scope.msg;
        var coupling_status = scope.postcouplestatus;

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

        // as templateUrl DOM is loaded, this function will get called.
        angular.element(document).ready(function() {
          $timeout(function(){
            $('div div .postlifebar').css("animation-duration", duration);
            console.log("Jquery called :" +  duration + " and msg:" + msg);

            $('div div #bubbleClick').click(function(){
              console.log('emit set:guidtgt', postguid);
              scope.$emit('set:guidtgt', postguid);
            });    
          }, 2);    
        });
    },
  }
});