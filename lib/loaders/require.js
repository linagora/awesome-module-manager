'use strict';

var AwesomeModuleLoader = require('../module-loader');

function requireLoader(trusted) {
  function load(modName, callback) {
    var mod;
    try {
      mod = require(modName);
    } catch (e) {
      return callback();
    }

    // duck typing
    if (!mod || !mod.playState || mod.name !== modName) {
      return callback();
    }
    return callback(null, mod);
  }

  return new AwesomeModuleLoader('require loader', load, trusted);
}

module.exports = requireLoader;
