var gulp = require('gulp');

var fs = require('fs');
fs.readdirSync(__dirname + '/gulp').forEach(function(task){
	require('./gulp/' + task);
});
/*
만약 현재폴더(__dirname)/gulp에 파일 1.js, 2.js, 3.js
가 있다면,
위 과정은 아래 과정을 처리한다.
require('./gulp/1.js');
require('./gulp/2.js');
require('./gulp/3.js');
--> 이렇게 새로운 파일이 생기든 지워지든 없데이트가 되는 스크립트인것이다.
*/

gulp.task('dev', ['watch:css', 'watch:js', 'dev:server']);
gulp.task('build', ['css', 'js']);