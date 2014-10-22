'use strict';

function AwesomeModuleManagerProxy(module, modulestore) {
  if (!module || !module.getDependencies) {
    throw new Error('AwesomeModuleManagerProxy: module argument is invalid ' + module);
  }
  this.store = modulestore;
  this.module = module;
}

AwesomeModuleManagerProxy.prototype._getDepModule = function(dep) {
  if (dep.type === dep.TYPE_ABILITY) {
    return this.store.getByAbility(dep.name);
  } else {
    return this.store.get(dep.name);
  }
};

AwesomeModuleManagerProxy.prototype.getProxy = function() {
  return function DependenciesProxy(name) {
    var dep = this.module.findDependencyByAlias(name);
    if (!dep) { return null; }
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
