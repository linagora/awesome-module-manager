'use strict';

function AwesomeModuleWrapper(module, trusted) {
  this.module = module;
  this.name = module.name;
  this.trusted = trusted ? true : false;
}

// wrap AwesomeModule methods
AwesomeModuleWrapper.prototype.getDependencies = function() {
  return this.module.getDependencies();
};

AwesomeModuleWrapper.prototype.getRequiredDependencies = function() {
  return this.module.getRequiredDependencies();
};

AwesomeModuleWrapper.prototype.getOptionalDependencies = function() {
  return this.module.getOptionalDependencies();
};

AwesomeModuleWrapper.prototype.findDependencyByAlias = function(alias) {
  return this.module.findDependencyByAlias(alias);
};

AwesomeModuleWrapper.prototype.hasAbility = function(name) {
  return this.module.hasAbility(name);
};

AwesomeModuleWrapper.prototype.getStateResult = function(state) {
  return this.module.getStateResult(state);
};

AwesomeModuleWrapper.prototype.getLib = function() {
  return this.module.getLib();
};

AwesomeModuleWrapper.prototype.getProxy = function(name, trusted) {
  return this.module.getProxy(name, trusted);
};

AwesomeModuleWrapper.prototype.isStateFulfilled = function(state) {
  return this.module.isStateFulfilled(state);
};

AwesomeModuleWrapper.prototype.isStateRejected = function(state) {
  return this.module.isStateRejected(state);
};

AwesomeModuleWrapper.prototype.isStatePending = function(state) {
  return this.module.isStatePending(state);
};

AwesomeModuleWrapper.prototype.playState = function(state, iface) {
  return this.module.playState(state, iface);
};

AwesomeModuleWrapper.prototype.getData = function() {
  return this.module.getData();
};

module.exports = AwesomeModuleWrapper;
