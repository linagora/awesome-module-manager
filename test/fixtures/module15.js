'use strict';

var AwesomeModule = require('awesome-module');
var AwesomeModuleDependency = AwesomeModule.AwesomeModuleDependency;

module.exports = new AwesomeModule('module15', {
  dependencies: [
    new AwesomeModuleDependency(AwesomeModuleDependency.TYPE_NAME, 'nonexistingmodule', 'nonexistingmodule', true),
    new AwesomeModuleDependency(AwesomeModuleDependency.TYPE_NAME, 'nonexistingmodule2', 'nonexistingmodule2', true)
  ]
});
