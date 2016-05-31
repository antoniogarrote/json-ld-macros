var gulp = require('gulp');
var nodeunit = require('gulp-nodeunit');


gulp.task('tests', function () {
    return gulp.src('./test/*.js')
        .pipe(nodeunit({
            'reporter': 'default',
            'reporterOptions': {
                'output': 'test'
            }
        }));
});

gulp.task('default', ['tests']);
