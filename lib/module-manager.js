'use strict';
var q = require('q');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var AwesomeModuleStateManager = require('./module-state-manager');
var AwesomeModuleLoader = require('./module-loader');
var AwesomeModuleLoaderCollection = require('./module-loader-collection');
var AwesomeModuleStore = require('./module-store');
var AwesomeStateStore = require('./state-store');
var AwesomeState = require('./state');
var codeLoader = require('./loaders/code');
var filesystemLoader = require('./loaders/filesystem');
var AwesomeConsoleLogger = require('./console-logger');


function AwesomeModuleManager(logger) {
  EventEmitter.call(this);

  this.logger = logger || new AwesomeConsoleLogger();
  this.moduleStore = new AwesomeModuleStore(this.logger);
  this.stateStore = new AwesomeStateStore(this.logger);
  this.loader = new AwesomeModuleLoaderCollection(this.moduleStore, logger);
  this.stateManager = new AwesomeModuleStateManager(this.moduleStore, this.stateStore, logger);
  this.loaders = {
    code: codeLoader,
    filesystem: filesystemLoader
  };

  /* proxy loader events */
  this.loader.on('loadstart', function(data) {
    this.emit('loader:loadstart', data);
  }.bind(this));
  this.loader.on('loaderror', function(data) {
    this.emit('loader:loaderror', data);
  }.bind(this));
  this.loader.on('loaded', function(data) {
    this.emit('loader:loaded', data);
  }.bind(this));

  /* proxy state events */
  this.stateManager.on('fire', function(data) {
    this.emit('state:fire', data);
  }.bind(this));
  this.stateManager.on('fulfilled', function(data) {
    this.emit('state:fulfilled', data);
  }.bind(this));
  this.stateManager.on('failed', function(data) {
    this.emit('state:failed', data);
  }.bind(this));
}

util.inherits(AwesomeModuleManager, EventEmitter);

/* proxy loader functions */
AwesomeModuleManager.prototype.appendLoader = function(loader) {
  return this.loader.registerLoader(loader);
};

AwesomeModuleManager.prototype.load = function(moduleNames) {
  if (Array.isArray(moduleNames)) {
    var promises = moduleNames.map(function(name) {
      return this.load(name);
    }.bind(this));
    return q.all(promises);
  }
  return this.loader.loadModuleAndDependencies(moduleNames);
};

AwesomeModuleManager.prototype.fire = function(stateName, moduleNames) {
  return this.load(moduleNames)
  .then(function() {
    if (Array.isArray(moduleNames)) {
      var promises = moduleNames.map(function(name) {
        return this.fire(stateName, name);
      }.bind(this));
      return q.all(promises);
    }

    return this._fireOne(stateName, moduleNames);
  }.bind(this));
};

AwesomeModuleManager.prototype._fireOne = function(stateName, moduleName) {
  return this.load(moduleName)
  .then(function() {
    var module = this.moduleStore.get(moduleName);
    return this.stateManager.fire(stateName, module);
  }.bind(this));
};

/* proxy states registering */
AwesomeModuleManager.prototype.registerState = function(name, dependencies) {
  var state = new AwesomeState(name, dependencies);
  this.stateStore.add(state);
};

/* module direct registering */
AwesomeModuleManager.prototype.registerModule = function(module, trusted) {
  if (!module.name || !module.playState) {
    throw new Error('module is not valid');
  }
  this.loader.registerLoader(this.loaders.code(module, trusted));
  return this.load(module.name);
};

AwesomeModuleManager.AwesomeModuleLoader = AwesomeModuleLoader;

module.exports = AwesomeModuleManager;
