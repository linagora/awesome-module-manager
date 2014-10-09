'use strict';

var rootPath = require('path').join(__dirname, '../..'),
    fixturesPath = require('path').join(__dirname, '..', 'fixtures'),
    libPath = rootPath + '/lib';
var expect = require('chai').expect;

describe('The code loader module', function() {
  it('should register an AwesomeModule', function() {
    var fsLoader = require(libPath + '/loaders/filesystem');
    var loader = fsLoader(fixturesPath);
    return loader;
  });

  describe('file loading', function() {
    it('should return the AwesomeModule if the name matches', function(done) {
      var fsLoader = require(libPath + '/loaders/filesystem');
      var loader = fsLoader(fixturesPath);
      loader.load('module1', function(err, resp) {
        expect(err).to.be.not.ok;
        expect(resp).to.be.ok;
        expect(resp.name).to.equal('module1');
        done();
      });
    });
  });

  describe('directory loading', function() {
    it('should return the AwesomeModule if the name matches', function(done) {
      var fsLoader = require(libPath + '/loaders/filesystem');
      var loader = fsLoader(fixturesPath);
      loader.load('module2', function(err, resp) {
        expect(err).to.be.not.ok;
        expect(resp).to.be.ok;
        expect(resp.name).to.equal('module2');
        done();
      });
    });
  });


  it('should not return the AwesomeModule if the name does not matches', function(done) {
    var fsLoader = require(libPath + '/loaders/filesystem');
    var loader = fsLoader(fixturesPath);
    loader.load('modulethatdoesnotexist', function(err, resp) {
      expect(err).to.be.not.ok;
      expect(resp).to.be.not.ok;
      done();
    });
  });

});
