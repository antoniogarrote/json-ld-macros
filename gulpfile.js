var gulp = require('gulp');
var nodeunit = require('gulp-nodeunit');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var clean = require('gulp-clean');

gulp.task('clean-dist', function(){
    return gulp.src('dist', {read: false})
        .pipe(clean());
});

gulp.task('tests', function () {
    return gulp.src('./test/*.js')
        .pipe(nodeunit({
            'reporter': 'default',
            'reporterOptions': {
                'output': 'test'
            }
        }));
});

gulp.task('browserify', ['clean-dist'], function() {
    return browserify('./src/macro.js')
        .bundle()
        .pipe(source('macro.js'))
        .pipe(gulp.dest('./dist/'));
});

gulp.task('default', ['tests', 'browserify']);
