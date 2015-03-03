'use strict';

var rootPath = require('path').join(__dirname, '..'),
    libPath = rootPath + '/lib';
var fixturesPath = require('path').join(__dirname, 'fixtures');
var expect = require('chai').expect;

describe('The ModuleLoaderCollection object', function() {

  beforeEach(function() {
    this.setupFsLoader = function() {
      var AwesomeModuleStore = require(libPath + '/module-store'), store = new AwesomeModuleStore();
      var AwesomeModuleLoaderCollection = require(libPath + '/module-loader-collection'), mlc = new AwesomeModuleLoaderCollection(store);
      var fsLoader = require(libPath + '/loaders/filesystem');
      var loader = fsLoader(fixturesPath);
      mlc.registerLoader(loader);
      return mlc;
    };
  });

  it('should load a module', function(done) {
    var mlc = this.setupFsLoader();
    mlc.loadModuleAndDependencies('module1').then(function(mod) {
      expect(mod).to.be.ok;
      expect(mod.name).to.equals('module1');
      done();
    }, done);
  });

  it('should support multiple loaders', function(done) {
    var mlc = this.setupFsLoader();
    var AwesomeModule = require('awesome-module');
    var codeLoader = require(libPath + '/loaders/code');
    var m = new AwesomeModule('test', {});
    var loader2 = codeLoader(m);
    mlc.registerLoader(loader2);
    mlc.loadModuleAndDependencies('module1').then(function(mod) {
      expect(mod).to.be.ok;
      expect(mod.name).to.equals('module1');
      mlc.loadModuleAndDependencies('test').then(function(mod) {
        expect(mod).to.be.ok;
        expect(mod.name).to.equals('test');
        done();
      }, done);
    }, done);
  });

  describe('dependency resolver', function() {

    it('should load a module and its dependency', function(done) {
      var mlc = this.setupFsLoader();
      mlc.loadModuleAndDependencies('module3').then(function(mod) {
        expect(mod).to.be.ok;
        expect(mod.name).to.equals('module3');
        done();
      }, done);
    });

    it('should fail to load a module if the dependency is not resolvable', function(done) {
      var mlc = this.setupFsLoader();
      mlc.loadModuleAndDependencies('badmodule1').then(done, function(err) {
        expect(err).to.be.ok;
        done();
      });
    });

    it('should load a module and its dependencies', function(done) {
      var mlc = this.setupFsLoader();
      mlc.loadModuleAndDependencies('module4').then(function(mod) {
        expect(mod).to.be.ok;
        expect(mod.name).to.equals('module4');
        done();
      }, done);
    });

    it('should load a module and its dependencies, recursively', function(done) {
      var mlc = this.setupFsLoader();
      mlc.loadModuleAndDependencies('module5').then(function(mod) {
        expect(mod).to.be.ok;
        expect(mod.name).to.equals('module5');
        done();
      }, done);
    });

    it('should load a module even if its optional dependencies are missing', function(done) {
      var mlc = this.setupFsLoader();
      var loaded = [];
      function onModule(name) {
        loaded.push(name);
      }
      mlc.loadModuleAndDependencies('module15', onModule).then(function(mod) {
        expect(mod).to.be.ok;
        expect(mod.name).to.equals('module15');
        expect(loaded).to.have.length(1);
        expect(loaded[0]).to.equal('module15');
        done();
      }, done);
    });
    it('should load a module and its optional dependencies', function(done) {
      var mlc = this.setupFsLoader();
      var loaded = [];
      function onModule(name) {
        loaded.push(name);
      }
      mlc.loadModuleAndDependencies('module17', onModule).then(function(mod) {
        expect(mod).to.be.ok;
        expect(mod.name).to.equals('module17');
        expect(loaded).to.have.length(2);
        expect(loaded[0]).to.equal('module16');
        expect(loaded[1]).to.equal('module17');
        done();
      }, done);
    });

    it('should load a module and its optional dependencies while ignoring missing dependencies', function(done) {
      var mlc = this.setupFsLoader();
      var loaded = [];
      function onModule(name) {
        loaded.push(name);
      }
      mlc.loadModuleAndDependencies('module18', onModule).then(function(mod) {
        expect(mod).to.be.ok;
        expect(mod.name).to.equals('module18');
        expect(loaded).to.have.length(2);
        expect(loaded[0]).to.equal('module16');
        expect(loaded[1]).to.equal('module18');
        done();
      }, done);
    });


    describe('ability resolver', function() {
      it('should load a module if its ability is known', function(done) {
        var mlc = this.setupFsLoader();
        mlc.loadModuleAndDependencies('module7').then(function(mod) {
          mlc.loadModuleAndDependencies('module6').then(function(mod) {
            expect(mod).to.be.ok;
            expect(mod.name).to.equals('module6');
            done();
          }, done);
        }, done);
      });

      it('should fail to load a module if its ability is unknown', function(done) {
        var mlc = this.setupFsLoader();
        mlc.loadModuleAndDependencies('module6').then(done, function(err) {
          done();
        });
      });
    });

    it('should fail to load a dependency module having circular dependency', function(done) {
      var mlc = this.setupFsLoader();
      var AwesomeModuleLoaderCollection = require(libPath + '/module-loader-collection');
      mlc.loadModuleAndDependencies('module11').then(done, function(err) {
        try {
          expect(err.code).to.equal(AwesomeModuleLoaderCollection.ERR_DEPENDENCY_RESOLUTION);
        } catch (e) {
          return done(e);
        }
        done();
      });
    });

    it('should fail to load a module having circular dependency', function(done) {
      var mlc = this.setupFsLoader();
      var AwesomeModuleLoaderCollection = require(libPath + '/module-loader-collection');
      mlc.loadModuleAndDependencies('module11').then(done, function(err) {
        try {
          expect(err.code).to.equal(AwesomeModuleLoaderCollection.ERR_DEPENDENCY_RESOLUTION);
        } catch (e) {
          return done(e);
        }
        done();
      });
    });


  });

  describe('eventemitter', function() {

    it('should emit a "loadstart" event when loading module', function(done) {
      var mlc = this.setupFsLoader();
      mlc.on('loadstart', function(data) {
        expect(data.name).to.equal('module1');
        done();
      });
      mlc.loadModuleAndDependencies('module1');
    });

    it('should emit a "loaderror" event when loading module in error', function(done) {
      var mlc = this.setupFsLoader();
      mlc.on('loaderror', function(err) {
        done();
      });
      mlc.loadModuleAndDependencies('nonexistingmodule1');
    });

    it('should emit a "loaded" event when loading module', function(done) {
      var mlc = this.setupFsLoader();
      mlc.on('loaded', function(data) {
        expect(data.name).to.equal('module1');
        expect(data.module).to.be.ok;
        expect(data.module.name).to.equal('module1');
        done();
      });
      mlc.loadModuleAndDependencies('module1');
    });

    describe('error', function() {

      it('should have code ERR_NOT_FOUND if module is not found', function(done) {
        var mlc = this.setupFsLoader();
        var AwesomeModuleLoaderCollection = require(libPath + '/module-loader-collection');
        mlc.on('loaderror', function(data) {
          expect(data.error.code).to.equal(AwesomeModuleLoaderCollection.ERR_NOT_FOUND);
          expect(data.name).to.equal('nonexistingmodule1');
          done();
        });
        mlc.loadModuleAndDependencies('nonexistingmodule1');
      });

      it('should have code ERR_NOT_FOUND if module has a bad format', function(done) {
        var mlc = this.setupFsLoader();
        var AwesomeModuleLoaderCollection = require(libPath + '/module-loader-collection');
        mlc.on('loaderror', function(data) {
          expect(data.error.code).to.equal(AwesomeModuleLoaderCollection.ERR_NOT_FOUND);
          expect(data.name).to.equal('badmodule2');
          done();
        });
        mlc.loadModuleAndDependencies('badmodule2');
      });

      it('should have code ERR_DEPENDENCY_RESOLUTION if a module dependency cannot be resolved', function(done) {
        var mlc = this.setupFsLoader();
        var AwesomeModuleLoaderCollection = require(libPath + '/module-loader-collection');
        mlc.on('loaderror', function(data) {
          expect(data.error.code).to.equal(AwesomeModuleLoaderCollection.ERR_DEPENDENCY_RESOLUTION);
          expect(data.name).to.equal('badmodule1');
          done();
        });
        mlc.loadModuleAndDependencies('badmodule1');
      });

    });

  });



});
