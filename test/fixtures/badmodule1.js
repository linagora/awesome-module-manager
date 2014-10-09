'use strict';

var AwesomeModule = require('awesome-module');
var AwesomeModuleDependency = AwesomeModule.AwesomeModuleDependency;

module.exports = new AwesomeModule('badmodule1', {
  dependencies: [
    new AwesomeModuleDependency(AwesomeModuleDependency.TYPE_NAME, 'nonexistingmodule1', 'module1')
  ]
});
