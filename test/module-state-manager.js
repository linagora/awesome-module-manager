'use strict';

var rootPath = require('path').join(__dirname, '..'),
    libPath = rootPath + '/lib';
var expect = require('chai').expect;

describe('The AwesomeModuleStateManager module', function() {
  beforeEach(function() {
    var AwesomeModuleStore = require(libPath + '/module-store');
    var AwesomeStateStore = require(libPath + '/state-store');
    var AwesomeModuleStateManager = require(libPath + '/module-state-manager');
    this.mstore = new AwesomeModuleStore();
    this.sstore = new AwesomeStateStore();
    this.amsm = new AwesomeModuleStateManager(this.mstore, this.sstore);
  });
  it('should fire the module state handler', function(done) {
    var AwesomeModule = require('awesome-module');
    var m = new AwesomeModule('module1', {
      lib: function(modules, callback) {
        done();
      }
    });
    this.mstore.set('module1', m);
    this.amsm.fire('lib', m);
  });

  it('should reject if the module state throw an error', function(done) {
    var AwesomeModule = require('awesome-module');
    var m = new AwesomeModule('module1', {
      lib: function(modules, callback) {
        throw new Error('It does not load');
      }
    });
    this.mstore.set('module1', m);
    var p = this.amsm.fire('lib', m);
    p.then(done, function(err) {
      expect(err.message).to.equal('It does not load');
      done();
    });
  });

  it('should fulfill if the module state is achieved', function(done) {
    var AwesomeModule = require('awesome-module');
    var m = new AwesomeModule('module1', {
      lib: function(modules, callback) {
        callback(null, {});
      }
    });
    this.mstore.set('module1', m);
    this.amsm.fire('lib', m).then(function() {
      done();
    }, done);
  });

  describe('module dependencies', function() {
    it('should fulfill if the module state is achieved', function(done) {
      var AwesomeModule = require('awesome-module');
      var AwesomeModuleDependency = AwesomeModule.AwesomeModuleDependency;
      var m = new AwesomeModule('module1', {
        lib: function(modules, callback) {
          callback(null, {});
        },
        dependencies: [
          new AwesomeModuleDependency(AwesomeModuleDependency.TYPE_NAME, 'module2', 'module2')
        ]
      });
      var m2 = new AwesomeModule('module2', {
        lib: function(modules, callback) {
          callback(null, {});
        }
      });

      this.mstore.set('module1', m);
      this.mstore.set('module2', m2);
      this.amsm.fire('lib', m).then(function() {
        done();
      }, done);
    });

    it('should fail if a dependency fails', function(done) {
      var AwesomeModule = require('awesome-module');
      var AwesomeModuleDependency = AwesomeModule.AwesomeModuleDependency;
      var m = new AwesomeModule('module1', {
        lib: function(modules, callback) {
          callback(null, {});
        },
        dependencies: [
          new AwesomeModuleDependency(AwesomeModuleDependency.TYPE_NAME, 'module2', 'module2')
        ]
      });
      var m2 = new AwesomeModule('module2', {
        lib: function(modules, callback) {
          throw new Error('Dead');
        }
      });

      this.mstore.set('module1', m);
      this.mstore.set('module2', m2);
      this.amsm.fire('lib', m).then(done, function() {
        done();
      });
    });

    it('should expose the dependency API', function(done) {
      var AwesomeModule = require('awesome-module');
      var AwesomeModuleDependency = AwesomeModule.AwesomeModuleDependency;
      var m = new AwesomeModule('module1', {
        lib: function(modules, callback) {
          var module2 = modules('module2');
          expect(module2.itisthelib).to.be.true;
          done();
        },
        dependencies: [
          new AwesomeModuleDependency(AwesomeModuleDependency.TYPE_NAME, 'module2', 'module2')
        ]
      });
      var m2 = new AwesomeModule('module2', {
        lib: function(modules, callback) {
          callback(null, {
            itisthelib: true
          });
        }
      });

      this.mstore.set('module1', m);
      this.mstore.set('module2', m2);
      this.amsm.fire('lib', m);
    });

    it('should expose the dependency API, respecting the alias', function(done) {
      var AwesomeModule = require('awesome-module');
      var AwesomeModuleDependency = AwesomeModule.AwesomeModuleDependency;
      var m = new AwesomeModule('module1', {
        lib: function(modules, callback) {
          var module2 = modules('alias1');
          expect(module2.itisthelib).to.be.true;
          done();
        },
        dependencies: [
          new AwesomeModuleDependency(AwesomeModuleDependency.TYPE_NAME, 'module2', 'alias1')
        ]
      });
      var m2 = new AwesomeModule('module2', {
        lib: function(modules, callback) {
          callback(null, {
            itisthelib: true
          });
        }
      });

      this.mstore.set('module1', m);
      this.mstore.set('module2', m2);
      this.amsm.fire('lib', m);
    });

  });

  describe('states dependencies', function() {

    it('should start any dependant state', function(done) {
      var AwesomeModule = require('awesome-module');
      var AwesomeState = require(libPath + '/state');
      var state1 = new AwesomeState('state1', ['lib']);
      var state2 = new AwesomeState('state2', ['state1']);
      this.amsm.stateStore.add(state1);
      this.amsm.stateStore.add(state2);
      var counter = '';
      var m = new AwesomeModule('module1', {
        lib: function(modules, callback) {
          counter += 'lib';
          callback(null, {itisthelib: true});
        },
        state1: function(modules, callback) {
          counter += 'state1';
          callback();
        },
        state2: function(modules, callback) {
          counter += 'state2';
          callback();
        }
      });

      this.mstore.set('module1', m);
      this.amsm.fire('state2', m).then(null, done).finally (function() {
        try {
          expect(counter).to.equal('libstate1state2');
        }catch (e) {
          return done(e);
        }
        done();
      });
    });

    it('should fail if any dependant state fails', function(done) {
      var AwesomeModule = require('awesome-module');
      var AwesomeState = require(libPath + '/state');
      var state1 = new AwesomeState('state1', ['lib']);
      var state2 = new AwesomeState('state2', ['state1']);
      this.amsm.stateStore.add(state1);
      this.amsm.stateStore.add(state2);
      var m = new AwesomeModule('module1', {
        lib: function(modules, callback) {
          callback(null, {itisthelib: true});
        },
        state1: function(modules, callback) {
          callback(new Error('failed'));
        },
        state2: function(modules, callback) {
          callback();
        }
      });

      this.mstore.set('module1', m);
      this.amsm.fire('state2', m).then(done, function() {
        done();
      });
    });

    it('should fail if any dependant state throws an error', function(done) {
      var AwesomeModule = require('awesome-module');
      var AwesomeState = require(libPath + '/state');
      var state1 = new AwesomeState('state1', ['lib']);
      var state2 = new AwesomeState('state2', ['state1']);
      this.amsm.stateStore.add(state1);
      this.amsm.stateStore.add(state2);
      var m = new AwesomeModule('module1', {
        lib: function(modules, callback) {
          callback(null, {itisthelib: true});
        },
        state1: function(modules, callback) {
          throw new Error('failed');
        },
        state2: function(modules, callback) {
          callback();
        }
      });

      this.mstore.set('module1', m);
      this.amsm.fire('state2', m).then(done, function() {
        done();
      });
    });

    it('should start any dependant state on dependencies', function(done) {
      var AwesomeModule = require('awesome-module');
      var AwesomeState = require(libPath + '/state');
      var AwesomeModuleDependency = AwesomeModule.AwesomeModuleDependency;
      var state1 = new AwesomeState('state1', ['lib']);
      var state2 = new AwesomeState('state2', ['state1']);
      this.amsm.stateStore.add(state1);
      this.amsm.stateStore.add(state2);
      var m = new AwesomeModule('module1', {
        lib: function(modules, callback) {
          callback(null, {});
        },
        state1: function(modules, callback) {
        },
        dependencies: [
          new AwesomeModuleDependency(AwesomeModuleDependency.TYPE_NAME, 'module2', 'module2')
        ]
      });
      var m2 = new AwesomeModule('module2', {
        lib: function(modules, callback) {
          callback(null, {itisthelib: true});
        },
        state1: function(modules, callback) {
          done();
        }
      });

      this.mstore.set('module1', m);
      this.mstore.set('module2', m2);
      this.amsm.fire('state2', m);
    });

  });

  describe('events', function() {
    it('should emit a "fire" event when a new state is starting', function(done) {
      var AwesomeModule = require('awesome-module');
      var AwesomeState = require(libPath + '/state');
      var state1 = new AwesomeState('state1', ['lib']);
      var state2 = new AwesomeState('state2', ['state1']);
      var events = {};
      this.amsm.stateStore.add(state1);
      this.amsm.stateStore.add(state2);
      var m = new AwesomeModule('module1', {
        lib: function(modules, callback) {
          callback(null, {itisthelib: true});
        },
        state1: function(modules, callback) {
          callback();
        },
        state2: function(modules, callback) {
          callback();
        }
      });

      this.mstore.set('module1', m);
      this.amsm.on('fire', function(data) {
        events[data.state] = true;
      });
      this.amsm.fire('state2', m).then(function() {
        try {
          expect(events.lib).to.be.ok;
          expect(events.state1).to.be.ok;
          expect(events.state2).to.be.ok;
          done();
        } catch (e) {
          done(e);
        }
      }, done);
    });

    it('should emit a "fulfilled" event when a new state is achieved', function(done) {
      var AwesomeModule = require('awesome-module');
      var AwesomeState = require(libPath + '/state');
      var state1 = new AwesomeState('state1', ['lib']);
      var state2 = new AwesomeState('state2', ['state1']);
      var events = {};
      this.amsm.stateStore.add(state1);
      this.amsm.stateStore.add(state2);
      var m = new AwesomeModule('module1', {
        lib: function(modules, callback) {
          callback(null, {itisthelib: true});
        },
        state1: function(modules, callback) {
          callback();
        },
        state2: function(modules, callback) {
          callback();
        }
      });

      this.mstore.set('module1', m);
      this.amsm.on('fulfilled', function(data) {
        events[data.state] = true;
      });
      this.amsm.fire('state2', m).delay(0).then(function() {
        try {
          expect(events.lib).to.be.ok;
          expect(events.state1).to.be.ok;
          expect(events.state2).to.be.ok;
          done();
        } catch (e) {
          done(e);
        }
      }, done);
    });

    it('should emit a "failed" event when a new state can\'t be achieved', function(done) {
      var AwesomeModule = require('awesome-module');
      var AwesomeState = require(libPath + '/state');
      var state1 = new AwesomeState('state1', ['lib']);
      var state2 = new AwesomeState('state2', ['state1']);
      this.amsm.stateStore.add(state1);
      this.amsm.stateStore.add(state2);
      var m = new AwesomeModule('module1', {
        lib: function(modules, callback) {
          callback(null, {itisthelib: true});
        },
        state1: function(modules, callback) {
          throw new Error('err');
        },
        state2: function(modules, callback) {
          callback();
        }
      });

      this.mstore.set('module1', m);
      this.amsm.on('failed', function(data) {
        expect(data.module.name).to.equal('module1');
        expect(data.state).to.equal('state1');
        done();
      });
      this.amsm.fire('state2', m);
    });

  });

});
