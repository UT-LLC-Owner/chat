const gulp = require('gulp')
const ts = require('gulp-typescript')
const project = ts.createProject('tsconfig.json')
const browserify = require('browserify')
const tsify = require('tsify')
const source = require('vinyl-source-stream')

gulp.task('copy-public', function () {
    return gulp.src(['src/public/*.html']).pipe(gulp.dest('dist/public'))
})

gulp.task('browser-js', function () {
    return browserify({
        basedir: '.',
        debug: true,
        entries: ['src/public/index.js'],
        cache: {},
        packageCache: {}
    })
        .plugin(tsify)
        .bundle()
        .pipe(source('bundle.js'))
        .pipe(gulp.dest('dist/public'));
});

gulp.task('default', gulp.series('copy-public', 'browser-js' ,function () {
    return project.src().pipe(project()).js.pipe(gulp.dest('dist'))
}))