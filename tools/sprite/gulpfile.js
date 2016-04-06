'use strict';

const gulp = require('gulp');
const gulpif = require('gulp-if');

const merge = require('merge-stream');
const sprity = require('sprity');

const App = {
  images: '../../app/public',
  css: '../../app/client/stylesheets/gen'
}


gulp.task('default', function() {
  const normal = {
    src: `../../assets/images/*.png`,
    name: 'icons',
    style: 'icons.css',
    cssPath: '',
    margin: 0,

    processor: require('./sprity-retina'),
    retinaUrl: 'icons@2x.png'
  };

  const retina = {
    src: `../../assets/images-retina/*.png`,
    name: 'icons@2x',
    margin: 0
  };

  return merge([normal, retina].map(function(options) {
    return sprity.src(options).pipe(
      gulpif('*.png', gulp.dest(App.images), gulp.dest(App.css))
    );
  }));
});
