angular.module('app')
.config(function ($routeProvider){
	$routeProvider
	.when('/', 
		{
			controller: 'PostsCtrl', 
			templateUrl: '/templates/posts.html'
		})
	// Redirect to the root page.
	.otherwise(
		{
   			redirectTo: '/'
		});
});
