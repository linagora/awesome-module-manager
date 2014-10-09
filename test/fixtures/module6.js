'use strict';

var AwesomeModule = require('awesome-module');
var AwesomeModuleDependency = AwesomeModule.AwesomeModuleDependency;

module.exports = new AwesomeModule('module6', {
  dependencies: [
    new AwesomeModuleDependency(AwesomeModuleDependency.TYPE_ABILITY, 'ability1', 'ab1')
  ]
});
