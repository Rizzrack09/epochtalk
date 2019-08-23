var fs = require('fs');
var sass = require('node-sass');
var Promise = require('bluebird');
var nodeSassGlobbing = require('node-sass-globbing');

// file params
var sassPath = './app/scss/app.scss';
var publicSassPath = './public/css/app.css';
var publicMapPath = './public/css/app';

module.exports = function(publicPath) {
  var currentSassPath = publicPath || publicSassPath;
  return new Promise(function(resolve, reject) {
    var opts = {
      file: sassPath,
      outputStyle: 'compressed',
      sourceMap: true,
      outFile: publicMapPath,
      importer: nodeSassGlobbing
    };
    sass.render(opts, function(error, result) {
      if (error) { return reject(error); }
      else { return resolve(result); }
    });
  })
  .then(function(output) {
    return new Promise(function(resolve, reject) {
      fs.writeFile(currentSassPath, output.css, function(err) {
        if (err) { reject(err); }
        else { return resolve(true); }
      });
      fs.writeFile(publicMapPath + '.map', output.map, function(err) {
        if (err) { reject(err); }
        else { return resolve(true); }
      });
    });
  })
  .tap(function() { console.log('SASS Compilation Complete'); });
};
