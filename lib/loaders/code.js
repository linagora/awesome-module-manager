'use strict';

var AwesomeModuleLoader = require('../module-loader');

function codeLoader(module, trusted) {
  function load(modName, callback) {
    if (modName !== module.name) {
      return callback();
    }
    callback(null, module);
  }

  return new AwesomeModuleLoader('codeloader of ' + module.name, load, trusted);
}

module.exports = codeLoader;
