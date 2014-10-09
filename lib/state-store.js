'use strict';
var AwesomeConsoleLogger = require('./console-logger');

function AwesomeStateStore(logger) {
  this.states = {};
  this.logger = logger || new AwesomeConsoleLogger();
}

AwesomeStateStore.prototype.add = function(state) {
  this.states[state.name] = state;
};

AwesomeStateStore.prototype.get = function(name) {
  return this.states[name];
};

module.exports = AwesomeStateStore;
