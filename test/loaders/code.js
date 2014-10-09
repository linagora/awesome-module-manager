'use strict';

var rootPath = require('path').join(__dirname, '../..'),
    libPath = rootPath + '/lib';
var expect = require('chai').expect;

describe('The code loader module', function() {
  it('should register an AwesomeModule', function() {
    var AwesomeModule = require(libPath + '/module');
    var m = new AwesomeModule('test', {});
    var codeLoader = require(libPath + '/loaders/code');
    var loader = codeLoader(m);
    return loader;
  });

  it('should return the AwesomeModule if the name matches', function(done) {
    var AwesomeModule = require(libPath + '/module');
    var m = new AwesomeModule('test', {});
    var codeLoader = require(libPath + '/loaders/code');
    var loader = codeLoader(m);
    loader.load('test', function(err, resp) {
      expect(err).to.be.not.ok;
      expect(resp).to.be.ok;
      expect(resp.name).to.equal('test');
      done();
    });
  });

  it('should not return the AwesomeModule if the name does not matches', function(done) {
    var AwesomeModule = require(libPath + '/module');
    var m = new AwesomeModule('test', {});
    var codeLoader = require(libPath + '/loaders/code');
    var loader = codeLoader(m);
    loader.load('test2', function(err, resp) {
      expect(err).to.be.not.ok;
      expect(resp).to.be.not.ok;
      done();
    });
  });

});
