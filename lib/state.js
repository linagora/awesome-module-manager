'use strict';

function AwesomeState(name, dependencies) {
  this.name = name;
  this.dependencies = dependencies || [];
}

AwesomeState.prototype.getDependencies = function() {
  return this.dependencies;
};

module.exports = AwesomeState;
