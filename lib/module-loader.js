'use strict';

function AwesomeModuleLoader(name, load, trusted) {
  if (!load) {
    throw new Error('AwesomeModuleLoader ' + name + ': load method is not defined');
  }
  this.name = name;
  this.load = load;
  this.trusted = trusted ? trusted : false;
}

module.exports = AwesomeModuleLoader;
