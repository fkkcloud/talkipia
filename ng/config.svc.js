angular.module('app')
.constant('ConfigSvc', {
	"web_socket"		: "ws://",
	"web_socket_secure" : "wss://",
	"local"				: "localhost",
	"local_ip"			: "192.168.0.4",
	//"deploy_dns"		: "cloudtalk.herokuapp.com",
	"deploy_dns"		: "talkipia.com",
	"port"				: "5000",
	"maxInstantLifeSpan": 5000,
});
