'use strict';

const fs = require('fs');
const gulp = require('gulp');

const plugins = require('gulp-load-plugins')();

// Download URL from entypo.com
const URL = 'https://dl.dropboxusercontent.com/u/4339492/entypo.zip';


function dirExists(path) {
  try {
    return fs.statSync(path).isDirectory();
  } catch (err) {
    return false;
  }
}

gulp.task('default', function() {
  const icons = fs.readFileSync('icons.txt', 'utf-8')
    .split('\n')
    .filter((line) => line);

  const files = icons.map(function(name) {
    return `entypo/Entypo+/Entypo+/${name}.svg`;
  });

  function stack() {
    gulp.src(files).pipe(plugins.svgSprite({
      mode: {
        stack: {
          dest: '.',
          sprite: 'icons.svg',
          /* example: true */ // Enable to get a preview
        }
      }
    })).pipe(gulp.dest('.'));
  }

  if (dirExists('entypo')) {
    stack();
  } else {
    plugins.download(URL)
      .pipe(plugins.decompress())
      .pipe(gulp.dest('entypo'))
      .on('end', stack);
  }
});
