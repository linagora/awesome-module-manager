'use strict';

function AwesomeModuleManagerProxy(module, modulestore) {
  if ( !module || !module.getDependencies ) {
    throw new Error('AwesomeModuleManagerProxy: module argument is invalid ' + module);
  }
  this.store = modulestore;
  this.module = module;
}

AwesomeModuleManagerProxy.prototype._getDepModule = function(dep) {
  var depModule;
  if ( dep.type === dep.TYPE_ABILITY ) {
    var abilities = this.store.getByAbility(dep.name);
    if( abilities.length ) {
      depModule = abilities[0];
    }
  } else {
    depModule = this.store.get(dep.name);
  }
  return depModule;
};

AwesomeModuleManagerProxy.prototype.getProxy = function() {
  return function DependenciesProxy(name) {
    var dep = this.module.findDependencyByAlias(name);
    if ( !dep ) { return null; }
    var depModule = this._getDepModule(dep);
    return depModule ? depModule.getLib() : null;
  }.bind(this);
};

AwesomeModuleManagerProxy.prototype.getDependencyArray = function() {
  return this.module.getDependencies()
  .map(function(dep) { return this._getDepModule(dep); }.bind(this))
  .filter(function(dep) { return dep ? true : false; });
};

module.exports = AwesomeModuleManagerProxy;
