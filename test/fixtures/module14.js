'use strict';

var AwesomeModule = require('awesome-module');
var AwesomeModuleDependency = AwesomeModule.AwesomeModuleDependency;

module.exports = new AwesomeModule('module14', {
  dependencies: [
    new AwesomeModuleDependency(AwesomeModuleDependency.TYPE_NAME, 'module12', 'module12')
  ]
});
