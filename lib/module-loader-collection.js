'use strict';

var q = require('q');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var ModuleLoadContext = require('./module-load-context');
var AwesomeConsoleLogger = require('./console-logger');

function AwesomeModuleLoaderCollection(store, logger) {
  this.loaders = [];
  this.loading = {};
  this.store = store;
  this.logger = logger || new AwesomeConsoleLogger();
  EventEmitter.call(this);
}

util.inherits(AwesomeModuleLoaderCollection, EventEmitter);

AwesomeModuleLoaderCollection.ERR_NOT_FOUND = 'ERR_NOT_FOUND';
AwesomeModuleLoaderCollection.ERR_DEPENDENCY_RESOLUTION = 'ERR_DEPENDENCY_RESOLUTION';
AwesomeModuleLoaderCollection.ERR_CIRCULAR_DEPENDENCY = 'ERR_CIRCULAR_DEPENDENCY';

AwesomeModuleLoaderCollection.prototype.registerLoader = function(loader) {
  this.loaders.push(loader);
};

AwesomeModuleLoaderCollection.prototype._moduleLoaded = function(name, module, onModule) {
  var deferred = this.loading[name];
  delete this.loading[name];
  this.store.set(name, module);
  deferred.resolve(module);
  onModule(name, module);
};

AwesomeModuleLoaderCollection.prototype._loadRequiredNamedDependencies = function(module, moduleContext) {
  var dependencies = module.getRequiredDependencies().filter(function(dep) {
    return dep.type === dep.TYPE_NAME;
  });
  this.logger.debug('AwesomeModuleLoaderCollection._loadRequiredNamedDependencies(', module.name, ') got ', dependencies.length, 'dependencies to fetch');
  return q.all(dependencies.map(function(dep) { return this.loadModuleAndDependencies(dep.name, null, moduleContext); }.bind(this)));
};

AwesomeModuleLoaderCollection.prototype._loadOptionalNamedDependencies = function(module, moduleContext) {
  var dependencies = module.getOptionalDependencies().filter(function(dep) {
    return dep.type === dep.TYPE_NAME;
  });
  this.logger.debug('AwesomeModuleLoaderCollection._loadOptionalNamedDependencies(', module.name, ') got ', dependencies.length, 'dependencies to fetch');
  var d = q.defer();
  q.all(
    dependencies.map(
      function(dep) {
          return this.loadModuleAndDependencies(dep.name, null, moduleContext)
          .then(function(module) {
            return q(module);
          }, function(err) {
            this.logger.debug('AwesomeModuleLoaderCollection._loadOptionalNamedDependencies(', dep.name, ') failed, silently ignoring');
            return q(true);
          }.bind(this));
      }.bind(this)
    )
  )
  .then(function(modules) {
    var filtered = modules.filter(function(mod) { return (mod !== true); });
    d.resolve(filtered);
  }).done();

  return d.promise;
};

AwesomeModuleLoaderCollection.prototype._getRequiredAbilityDependencies = function(module) {
  var deferred = q.defer();
  var abdependencies = this._requiredAbilityDependencies(module);
  this.logger.debug('AwesomeModuleLoaderCollection._getRequiredAbilityDependencies(' + module.name + '), ' + abdependencies.length + ' dependencies');
  var missingAbDependencies = abdependencies.filter(function(depres) { return depres.found === false; });
  this.logger.debug('AwesomeModuleLoaderCollection._getRequiredAbilityDependencies(', module.name, '), ', missingAbDependencies.length, 'missing dependencies');

  if (missingAbDependencies.length) {
    deferred.reject(
      new Error('Abilities not found: ' + missingAbDependencies.map(function(depres) { return depres.name;}))
    );
  } else {
    var deps = abdependencies.map(function(depres) { return depres.module; });
    deferred.resolve(deps);
  }
  return deferred.promise;
};

AwesomeModuleLoaderCollection.prototype._requiredAbilityDependencies = function(module) {
  var store = this.store;
  var depres;
  depres = module.getRequiredDependencies().filter(function(dep) {
    return dep.type === dep.TYPE_ABILITY;
  }).map(function(dep) {
    var depModule = store.getByAbility(dep.name);
    return {
      name: dep.name,
      found: depModule ? true : false,
      module: depModule
    };
  });
  return depres;
};

AwesomeModuleLoaderCollection.prototype._loadDependencies = function(moduleContext) {
  return function(module) {
    return q.all([
      this._loadRequiredNamedDependencies(module, moduleContext),
      this._loadOptionalNamedDependencies(module, moduleContext),
      this._getRequiredAbilityDependencies(module)
    ])
    .catch (function(err) {
      err.code = AwesomeModuleLoaderCollection.ERR_DEPENDENCY_RESOLUTION;
      throw err;
    });
  }.bind(this);
};

AwesomeModuleLoaderCollection.prototype._findCircularDependencies = function(moduleContext) {
  var loop = moduleContext.getCircualLoop();
  if (loop) {
    loop.reverse();
    var errText = 'AwesomeModuleLoaderCollection._findCircularDependencies(): circular dependency detected: ' +
                      loop.join(' => ');
    this.logger.error(errText);
    return new Error(errText);
  }
};

AwesomeModuleLoaderCollection.prototype.loadModuleAndDependencies = function(name, onModule, moduleContext) {
  var self = this;
  onModule = onModule || function() {};
  function reject(err, errcode) {
    err.code = errcode;
    deferred.reject(err);
    self.emit('loaderror', {
        name: name,
        module: module,
        context: moduleContext,
        error: err
      });
  }


  this.logger.debug('AwesomePluginManager loadModuleAndDependencies starts(', name, ')');
  moduleContext = new ModuleLoadContext(name, moduleContext, onModule);
  var circularErr = this._findCircularDependencies(moduleContext);
  if (circularErr) {
    circularErr.code = AwesomeModuleLoaderCollection.ERR_CIRCULAR_DEPENDENCY;
    return q.reject(circularErr);
  }

  if (this.loading[name]) {
    return this.loading[name].promise;
  } else if (this.store.get(name)) {
    return q(this.store.get(name));
  }

  var module;
  var deferred = q.defer();
  this.loading[name] = deferred;

  this.emit('loadstart', {name: name, context: moduleContext});

  this
  ._loadModule(name)
  .then(function(mod) {
    module = mod;
    self.logger.debug('AwesomeModuleLoaderCollection.loadModuleAndDependencies(', name, ') dependency call');
    return q(module);
  })
  .then(this._loadDependencies(moduleContext))
  .then(function(dependencies) {
    this.logger.debug('AwesomeModuleLoaderCollection.loadModuleAndDependencies[' + name + '] all dependencies resolved, sending back the module');
    this._moduleLoaded(name, module, moduleContext.onModule);
    this.emit('loaded', {name: name, module: module, context: moduleContext});
  }.bind(this))
  .catch (function(err) {
    reject(err, err.code);
  });
  return deferred.promise;
};

AwesomeModuleLoaderCollection.prototype._loadModule = function(name) {
  var loaders = this.loaders.slice();
  var deferred = q.defer();
  var logger = this.logger;
  function _loadOne() {
    var loader = loaders.shift();
    if (!loader) {
      var err = new Error('Module "' + name + '" not found');
      err.code = AwesomeModuleLoaderCollection.ERR_NOT_FOUND;
      deferred.reject(err);
      return;
    }

    loader.load(name, function(err, resp) {
      if (err) {
        logger.debug('got an error loading ' + name + ' with loader ' + loader.name, err);
      } else if (resp) {
        return deferred.resolve(resp);
      }
      _loadOne();
    });
  }

  _loadOne();

  return deferred.promise;
};

module.exports = AwesomeModuleLoaderCollection;
