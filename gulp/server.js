var gulp = require('gulp');
var nodemon = require('gulp-nodemon');

// nodemon()에 객체를 넣었다.
// 객체는 프로퍼티들을 갖는데,
// script는 현재 최상위 폴더의 server script파일을 가리키는것으로 보이고,
// ext에는 *.js에 변화가 생길때 서버를 재시작하라고 하는부분.
gulp.task('dev:server', function(){
	nodemon({
		script: 'server.js',
		ext:    'js css',
		ignore: ['ng*', 'gulp*', 'assets*']
	})
});