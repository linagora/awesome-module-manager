'use strict';
var AwesomeModuleLoader = require('../module-loader');
var fs = require('fs');
var Path = require('path');
var q = require('q');

function readDirAndStat(path, callback) {
  return q.nfcall(fs.readdir, path)
  .then(function(files) {
    if (!files.length) {
      return q(files);
    }
    var all = files.map(function(file) {
      var p = Path.join(path, file);
      var d = q.defer();
      fs.stat(p, function(err, stat) {
        if (err) {
          d.reject(err);
        } else {
          d.resolve({name: file, fullPath: p, stat: stat});
        }
      });
      return d.promise;
    });
    return q.all(all);
  });
}

function filesystemLoader(path, trusted) {

  function load(modName, callback) {
    readDirAndStat(path).then(function(pathList) {
      var matchName = pathList.filter(function(pathEntry) {
        return (pathEntry.name === modName ||
                 pathEntry.name === modName + '.js');
      });

      if (! matchName.length) {
        console.log('matchname failed');
        return callback();
      }

      var moduleEntry = matchName[0];

      if (moduleEntry.stat.isDirectory() || moduleEntry.stat.isFile()) {
        var module = require(moduleEntry.fullPath);

        //duck typing
        if (!module || !module.playState) {
          return callback();
        }
        return callback(null, module);
      }
      return callback();
    }, function(err) {
      return callback();
    }).done();
  }

  return new AwesomeModuleLoader('filesystem on ' + path, load, trusted);
}

module.exports = filesystemLoader;
