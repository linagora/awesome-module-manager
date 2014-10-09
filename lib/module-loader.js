'use strict';

function AwesomeModuleLoader(name, load) {
  if (!load) {
    throw new Error('AwesomeModuleLoader ' + name + ': load method is not defined');
  }
  this.name = name;
  this.load = load;
}

module.exports = AwesomeModuleLoader;
