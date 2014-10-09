'use strict';

var AwesomeModule = require('awesome-module');
var AwesomeModuleDependency = AwesomeModule.AwesomeModuleDependency;

module.exports = new AwesomeModule('module12', {
  dependencies: [
    new AwesomeModuleDependency(AwesomeModuleDependency.TYPE_NAME, 'module13', 'module13')
  ]
});
