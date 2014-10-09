'use strict';

var AwesomeModule = require('awesome-module');
var AwesomeModuleDependency = AwesomeModule.AwesomeModuleDependency;

module.exports = new AwesomeModule('module4', {
  dependencies: [
    new AwesomeModuleDependency(AwesomeModuleDependency.TYPE_NAME, 'module1', 'module1'),
    new AwesomeModuleDependency(AwesomeModuleDependency.TYPE_NAME, 'module2', 'module1')
  ]
});
