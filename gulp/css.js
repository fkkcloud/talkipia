var gulp = require('gulp');
var stylus = require('gulp-stylus');
var sourcemaps = require('gulp-sourcemaps');

gulp.task('css', function(){
	gulp.src('css/**/*.styl')
		.pipe(sourcemaps.init())
		.pipe(stylus())
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('assets'));
});

// 감시
gulp.task('watch:css', ['css'], function(){
	gulp.watch('css/**/*.styl', ['css']);
});

