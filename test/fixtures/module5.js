'use strict';

var AwesomeModule = require('awesome-module');
var AwesomeModuleDependency = AwesomeModule.AwesomeModuleDependency;

module.exports = new AwesomeModule('module5', {
  dependencies: [
    new AwesomeModuleDependency(AwesomeModuleDependency.TYPE_NAME, 'module4', 'module4')
  ]
});
