var express = require('express');
var bodyParser = require('body-parser');
var logger = require('morgan');
var socket = require('./web_socket/websockets');
var favicon = require('serve-favicon');



var app = express();
app.use(favicon(__dirname + '/resources/favicon.ico'));
app.use(bodyParser.json());
app.use(logger('dev'));

app.use('/', require('./controllers')); // get router from controller's index.js

// server 객체는 http.Server에서 얻는것인다 app.listen() 이 이를 리턴한다는 점
var server = app.listen(process.env.PORT || 5000, function(){
	console.log('Server listening on', server.address().port);
});

socket.connect(server); // web socket server가 된다.

