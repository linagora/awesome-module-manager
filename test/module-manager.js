'use strict';

var rootPath = require('path').join(__dirname, '..'),
    libPath = rootPath + '/lib';
var expect = require('chai').expect;
var q = require('q');
var mockery = require('mockery');

describe('The AwesomeModuleStateManager module', function() {

  it('should expose the code and filesystem loaders', function() {
    var AwesomeModuleManager = require(libPath + '/module-manager');
    var amm = new AwesomeModuleManager();
    expect(amm.loaders).to.be.ok;
    expect(amm.loaders.code).to.be.ok;
    expect(amm.loaders.code).to.be.a.function;
    expect(amm.loaders.filesystem).to.be.ok;
    expect(amm.loaders.filesystem).to.be.a.function;
  });

  describe('API', function() {

    it('should have an appendLoader method', function() {
      var AwesomeModuleManager = require(libPath + '/module-manager');
      var amm = new AwesomeModuleManager();
      expect(amm).to.have.property('appendLoader');
      expect(amm.appendLoader).to.be.a('function');
    });

    it('should have a load method', function() {
      var AwesomeModuleManager = require(libPath + '/module-manager');
      var amm = new AwesomeModuleManager();
      expect(amm).to.have.property('load');
      expect(amm.load).to.be.a('function');
    });

    it('should have a fire method', function() {
      var AwesomeModuleManager = require(libPath + '/module-manager');
      var amm = new AwesomeModuleManager();
      expect(amm).to.have.property('fire');
      expect(amm.fire).to.be.a('function');
    });

    it('should have a on method', function() {
      var AwesomeModuleManager = require(libPath + '/module-manager');
      var amm = new AwesomeModuleManager();
      expect(amm).to.have.property('on');
      expect(amm.on).to.be.a('function');
    });

    it('should have a once method', function() {
      var AwesomeModuleManager = require(libPath + '/module-manager');
      var amm = new AwesomeModuleManager();
      expect(amm).to.have.property('once');
      expect(amm.once).to.be.a('function');
    });

    it('should have a registerState method', function() {
      var AwesomeModuleManager = require(libPath + '/module-manager');
      var amm = new AwesomeModuleManager();
      expect(amm).to.have.property('registerState');
      expect(amm.registerState).to.be.a('function');
    });

    it('should have a registerModule method', function() {
      var AwesomeModuleManager = require(libPath + '/module-manager');
      var amm = new AwesomeModuleManager();
      expect(amm).to.have.property('registerModule');
      expect(amm.registerModule).to.be.a('function');
    });
  });

  describe('load method', function() {

    beforeEach(function() {
      mockery.enable({warnOnReplace: false, warnOnUnregistered: false, useCleanCache: true});
    });

    afterEach(function() {
      mockery.resetCache();
      mockery.deregisterAll();
      mockery.disable();
    });

    it('should call the loader loadModuleAndDependencies() method', function(done) {
      var mock = function() {};
      mock.prototype.on = function() {};
      mock.prototype.loadModuleAndDependencies = function(name) {
        expect(name).to.equal('module1');
        done();
      };
      mockery.registerMock('./module-loader-collection', mock);
      var AwesomeModuleManager = require(libPath + '/module-manager');
      var amm = new AwesomeModuleManager();
      amm.load('module1');
    });

    it('should call the loader loadModuleAndDependencies() method for each item if the argument is an array', function(done) {
      var called = [];
      var mock = function() {};
      mock.prototype.on = function() {};
      mock.prototype.loadModuleAndDependencies = function(name) {
        called.push(name);
        return q(true);
      };
      mockery.registerMock('./module-loader-collection', mock);
      var AwesomeModuleManager = require(libPath + '/module-manager');
      var amm = new AwesomeModuleManager();
      amm.load(['module1', 'module2', 'module3']).then(function() {
        expect(called).to.have.length(3);
        expect(called).to.contain('module1');
        expect(called).to.contain('module2');
        expect(called).to.contain('module3');
        done();
      });
    });

  });

  describe('fire method', function() {
    it('should call the load() method on the module name', function(done) {
      var AwesomeModuleManager = require(libPath + '/module-manager');
      var amm = new AwesomeModuleManager();
      amm.load = function(name) {
        expect(name).to.equal('module1');
        done();
        return {then: function() {}};
      };
      amm.fire('state1', 'module1');
    });


  });

});
