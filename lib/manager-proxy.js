'use strict';

function AwesomeModuleManagerProxy(module, modulestore) {
  this.store = modulestore;

  var dependencies = {};
  module.getDependencies().map(function(dep) {
    if (dep.type === dep.TYPE_ABILITY) {
      var ab = modulestore.getByAbility(dep.name);
      if (ab) {
        dependencies[dep.alias] = ab;
      }
    } else if (dep.type === dep.TYPE_NAME) {
      var m = modulestore.get(dep.name);
      if (m) {
        dependencies[dep.alias] = m;
      }
    }
  });
  this.dependencies = dependencies;
}

AwesomeModuleManagerProxy.prototype.getProxy = function() {
  var dependencies = this.dependencies;
  return function(name) {
    return dependencies[name].getLib();
  };
};

AwesomeModuleManagerProxy.prototype.getDependencies = function() {
  var back = {};
  Object.keys(this.dependencies).forEach(function(k) {
    back[k] = this.dependencies[k];
  }.bind(this));
  return back;
};

AwesomeModuleManagerProxy.prototype.getDependencyArray = function() {
  return Object.keys(this.dependencies).map(function(k) {
    return this.dependencies[k];
  }.bind(this));
};

module.exports = AwesomeModuleManagerProxy;

