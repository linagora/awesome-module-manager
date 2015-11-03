'use strict';

var rootPath = require('path').join(__dirname, '../..'),
    libPath = rootPath + '/lib';
var expect = require('chai').expect;

describe('The require loader module', function() {

  it('should return an awesome module', function(done) {
    var requireLoader = require(libPath + '/loaders/require')(true);
    requireLoader.load('module1', function(err, mod) {
      expect(err).to.be.not.ok;
      expect(mod).to.be.ok;
      expect(mod.name).to.equal('module1');
      done();
    });
  });

  it('should return nothing if the module does not exist', function(done) {
    var requireLoader = require(libPath + '/loaders/require')(true);
    requireLoader.load('nonexistingmodule', function(err, mod) {
      expect(err).to.be.not.ok;
      expect(mod).to.be.undefined;
      done();
    });
  });

  it('should return nothing if the module name does not match the require name', function(done) {
    var requireLoader = require(libPath + '/loaders/require')(true);
    requireLoader.load('badmodule3', function(err, mod) {
      expect(err).to.be.not.ok;
      expect(mod).to.be.undefined;
      done();
    });
  });

});
