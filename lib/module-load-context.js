'use strict';

function ModuleLoadContext(name, childContext, onModule) {
  this.name = name;
  this.context = childContext;
  if (childContext) {
    this.onModule = childContext.onModule;
  } else if (onModule) {
    this.onModule = onModule;
  } else {
    this.onModule = null;
  }
}

ModuleLoadContext.prototype.getCircualLoop = function() {
  var moduleNames = [this.name];
  var prevContext = this.context;
  while (prevContext) {
    if (moduleNames.indexOf(prevContext.name) >= 0) {
      moduleNames.push(prevContext.name);
      return moduleNames;
    }
    moduleNames.push(prevContext.name);
    prevContext = prevContext.context;
  }
};

ModuleLoadContext.prototype.getLoadPath = function() {
  var moduleNames = [this.name];
  var prevContext = this.context;
  while (prevContext) {
    if (moduleNames.indexOf(prevContext.name)) {
      throw new Error('Circual dependency');
    }
    moduleNames.push(prevContext.name);
    prevContext = prevContext.context;
  }
  return moduleNames;
};

module.exports = ModuleLoadContext;
