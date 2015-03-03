'use strict';
var AwesomeConsoleLogger = require('./console-logger');

function AwesomeModuleStore(logger) {
  this.logger = logger || new AwesomeConsoleLogger();
  this.modules = {};
  this.abilityResolver = {};
}

AwesomeModuleStore.prototype.set = function(name, module) {
  if (this.modules[name]) {
    throw new Error('AwesomeModuleStore: trying to set already set module name ' + name);
  }
  this.log_insane('AwesomeModuleStore.set(' + name + ') setting module in store');
  this.modules[name] = module;
};

AwesomeModuleStore.prototype.get = function(name) {
  return this.modules[name];
};

AwesomeModuleStore.prototype.getByAbility = function(ability) {
  if (this.abilityResolver[ability]) {
    return this.abilityResolver[ability];
  }
  var modules = this.modules;
  var selected = Object.keys(modules)
  .map(function(name) { return modules[name]; })
  .filter(function(m) {return m.hasAbility(ability);});
  if (selected.length) {
    this.abilityResolver[ability] = selected[0];
    return selected[0];
  }
  return false;
};

AwesomeModuleStore.prototype.getDependency = function(dependency) {
  if (dependency.type === dependency.TYPE_NAME) {
    return this.get(dependency.name);
  } else if (dependency.type === dependency.TYPE_ABILITY) {
    return this.getByAbility(dependency.name);
  }
};

AwesomeModuleStore.prototype.getDependencies = function(dependencies) {
  try {
  return dependencies.map(function(dependency) {
    return this.getDependency(dependency);
  }.bind(this));
}catch (e) {console.log('ERR1', e);}
};

AwesomeModuleStore.prototype.getDependentModules = function(module) {
  try {
  var dependentModules = [];
  Object.keys(this.modules).filter(function(k) {
    var mod = this.modules[k];
    var dependencies = mod.getDependencies();
    dependencies.forEach(function(dep) {
      if (dep.type === dep.TYPE_NAME && dep.name === module.name) {
        dependentModules.push({module: mod, definition: dep});
      } else if (dep.type === dep.TYPE_ABILITY && module.hasAbility(dep.name)) {
        dependentModules.push({module: mod, definition: dep});
      }
    });
  }.bind(this));
  return dependentModules;
}catch (e) {console.log('ERR1', e);}
};

require('./logger-helper-mixin')(AwesomeModuleStore);

module.exports = AwesomeModuleStore;
