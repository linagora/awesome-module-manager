'use strict';

var AwesomeModuleLoader = require('../module-loader');

function codeLoader(module) {
  function load(modName, callback) {
    if (modName !== module.name) {
      return callback();
    }
    callback(null, module);
  }

  return new AwesomeModuleLoader('codeloader of ' + module.name, load);
}

module.exports = codeLoader;
