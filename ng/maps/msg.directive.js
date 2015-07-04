angular.module('app')
.directive('mapMsg', function () {
  return {
    restrict: 'A',
    templateUrl: './templates/window.html',
    link: function(scope, attrs) {        
        var duration = scope.postlife + "ms";

        // as templateUrl DOM is loaded, this function will get called.
        angular.element(document).ready(function() {
          $('div div .postlifebar').css("animation-duration", duration);
        });
        
       }
   }
});