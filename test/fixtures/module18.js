'use strict';

var AwesomeModule = require('awesome-module');
var AwesomeModuleDependency = AwesomeModule.AwesomeModuleDependency;

module.exports = new AwesomeModule('module18', {
  dependencies: [
    new AwesomeModuleDependency(AwesomeModuleDependency.TYPE_NAME, 'nonexistingmodule', 'nonexistingmodule', true),
    new AwesomeModuleDependency(AwesomeModuleDependency.TYPE_NAME, 'module16', 'module16', true)
  ]
});
