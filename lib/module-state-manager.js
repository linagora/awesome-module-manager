'use strict';

var q = require('q');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var AwesomeState = require('./state');
var AwesomeModuleManagerProxy = require('./manager-proxy');
var AwesomeConsoleLogger = require('./console-logger');


function AwesomeModuleStateManager(moduleStore, stateStore, logger) {
  this.moduleStore = moduleStore;
  this.proxyStore = {};
  this.stateStore = stateStore;
  this.logger = logger || new AwesomeConsoleLogger();
  this.stateStore.add(
    new AwesomeState('lib')
  );
  EventEmitter.call(this);
}

util.inherits(AwesomeModuleStateManager, EventEmitter);

AwesomeModuleStateManager.prototype._ensureValidState = function(stateName) {
  if (this.stateStore.get(stateName)) {
    return q(true);
  } else {
    return q.reject(new Error('State "' + stateName + '" is unknown'));
  }
};

AwesomeModuleStateManager.prototype._getProxy = function(module) {
  if (!module || !module.name) {
    throw new Error('AwesomeModuleStateManager._getProxy: module argument is invalid');
  }
  return function() {
    if (this.proxyStore[module.name]) {
      return q(this.proxyStore[module.name]);
    }
    var proxy = new AwesomeModuleManagerProxy(module, this.moduleStore);
    this.proxyStore[module.name] = proxy;
    return q(proxy);
  }.bind(this);
};

AwesomeModuleStateManager.prototype._fireModuleDependenciesState = function(stateName, module) {
  return function() {
    this.log_insane('AwesomeModuleStateManager._fireModuleDependenciesState(' + stateName + ') launching for dependencies of ' + module.name);
    var promises = this.proxyStore[module.name].getDependencyArray().map(function(m) {
      return this.fire(stateName, m);
    }.bind(this));
    return q.all(promises);
  }.bind(this);
};

AwesomeModuleStateManager.prototype._fireModuleStateCallbacks = function(stateName, module) {
  var store = this.moduleStore,
      proxyStore = this.proxyStore,
      log_insane = this.log_insane.bind(this);
  return function() {
    log_insane('AwesomeModuleStateManager._fireModuleStateCallbacks(' + module.name + ')');

    // modules I depend on
    var promises = module.getDependencies().map(function(dependency) {
      return { definition: dependency, module: store.getDependency(dependency) };
    })
    .filter(function(dependency) {
      return dependency.module && dependency.module.isStateFulfilled(stateName);
    })
    .map(function(dependency) {
      log_insane('AwesomeModuleStateManager._fireModuleStateCallbacks(' + module.name + '): launching callbacks for ' +
        module.name + ' dependency ' + dependency.definition.name + '(' + dependency.definition.type + ')');
      return dependency.definition.fireCallbacks(stateName, module, proxyStore[module.name].getProxy());
    });

    // modules that depends on me
    var dependentsPromises = store.getDependentModules(module).filter(function(modDep) {
      return modDep.module.isStateFulfilled(stateName);
    })
    .map(function(modDep) {
      log_insane('AwesomeModuleStateManager._fireModuleStateCallbacks(' + module.name + '): launching callbacks for ' +
        modDep.module.name + ' dependency ' + modDep.definition.name + '(' + modDep.definition.type + ')');
      return modDep.definition.fireCallbacks(stateName, modDep.module, proxyStore[modDep.module.name].getProxy());
    });

    if (dependentsPromises.length) { promises = promises.concat(dependentsPromises); }
    if (!promises.length) { return q(true); }

    var passThroughPromises = promises.map(function(p) {
      var d = q.defer();
      p.finally(function() { d.resolve(true); }).done();
      return d.promise;
    });
    return q.all(passThroughPromises);
  };
};

AwesomeModuleStateManager.prototype._fireModuleState = function(stateName, module) {
  var store = this.proxyStore;
  return function() {
    this.emit('fire', {state: stateName, module: module});
    var d = q.defer();
    var promise = module.playState(stateName, store[module.name].getProxy()).then(
      function(res) {
        d.resolve(res);
        this.emit('fulfilled', { state: stateName, module: module });
      }.bind(this),
      function(err) {
        d.reject(err);
        this.emit('failed', { state: stateName, module: module, error: promise.inspect().reason });
      }.bind(this)
    );
    promise.done();
    return d.promise;
  }.bind(this);
};

AwesomeModuleStateManager.prototype._fireLibState = function(module) {
  return function() {
    return this._fireModuleDependenciesState('lib', module)()
    .then(this._fireModuleState('lib', module))
    .then(this._fireModuleStateCallbacks('lib', module));
  }.bind(this);
};

AwesomeModuleStateManager.prototype._fireDependantStates = function(stateName, module) {
  return function() {
    var depsName = this.stateStore.get(stateName).getDependencies();
    var promises = depsName.filter(function(name) {
      return name !== 'lib';
    }).map(function(name) {
      this.log_insane('AwesomeModuleStateManager._fireDependantStates(' + stateName + '), adding dependency ' + name);
      return this.fire(name, module);
    }.bind(this));
    return q.all(promises);
  }.bind(this);
};

AwesomeModuleStateManager.prototype.fire = function(stateName, module) {
  return this._ensureValidState(stateName)
  .then(this._getProxy(module))
  .then(this._fireLibState(module))
  .then(this._fireDependantStates(stateName, module))
  .then(this._fireModuleDependenciesState(stateName, module))
  .then(this._fireModuleState(stateName, module))
  .then(this._fireModuleStateCallbacks(stateName, module));
};

require('./logger-helper-mixin')(AwesomeModuleStateManager);

module.exports = AwesomeModuleStateManager;
