'use strict';
var AwesomeConsoleLogger = require('./console-logger');

function AwesomeModuleStore(logger) {
  this.logger = logger || new AwesomeConsoleLogger();
  this.modules = {};
}

AwesomeModuleStore.prototype.set = function(name, module) {
  if (this.modules[name]) {
    throw new Error('AwesomeModuleStore: trying to set already set module name ' + name);
  }
  this.logger.debug('AwesomeModuleStore.set(' + name + ') setting module in store');
  this.modules[name] = module;
};

AwesomeModuleStore.prototype.get = function(name) {
  return this.modules[name];
};

AwesomeModuleStore.prototype.getByAbility = function(ability) {
  var modules = this.modules;
  var selected = Object.keys(modules)
  .map(function(name) { return modules[name]; })
  .filter(function(m) {return m.hasAbility(ability);});
  return selected;
};

module.exports = AwesomeModuleStore;
