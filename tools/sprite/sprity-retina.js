'use strict';

const Promise = require('bluebird');
const readFile = Promise.promisify(require('fs').readFile);

const path = require('path');
const strip = require('strip-indent');


const process = Promise.method(function(src, layouts, opt, Handlebars) {
  Handlebars.registerHelper({
    retinaUrl() {
      return opt.retinaUrl;
    },

    coord(val) {
      return val ? `-${val}px` : '0';
    }
  });

  const template = Handlebars.compile(src, {
    preventIndent: true
  });

  return strip(template({
    layouts: layouts
  }));
});

module.exports = {
  process(layouts, opt, Handlebars) {
    const template = path.join(__dirname, 'sprite.hbs');

    return readFile(template, 'utf-8').then(function(data) {
      return process(data, layouts, opt, Handlebars);
    });
  },

  isBeautifyable() {
    return false;
  },

  extension() {
    return 'css';
  }
};
