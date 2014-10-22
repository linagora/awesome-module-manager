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
    this.amsm.fire('lib', m).done();
  });

  it('should reject if the module state throw an error', function(done) {
    var AwesomeModule = require('awesome-module');
    var m = new AwesomeModule('module1', {
      lib: function(modules, callback) {
        throw new Error('It does not load');
      }
    });
    this.mstore.set('module1', m);
    this.amsm.fire('lib', m).then(done, function(err) {
      expect(err.message).to.equal('It does not load');
      done();
    }).done();
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
    }, done).done();
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
      }, done).done();
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
      }).done();
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
      this.amsm.fire('lib', m).done();
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
      this.amsm.fire('lib', m).done();
    });

    describe('dynamic dependencies', function() {
      it('should resolve the dependency by name, when it is available', function(done) {
        var AwesomeModule = require('awesome-module');
        var AwesomeModuleDependency = AwesomeModule.AwesomeModuleDependency;
        var module1lib = {};
        var m = new AwesomeModule('module1', {
          lib: function(modules, callback) {
            module1lib.modules = modules;
            callback(null, module1lib);
          },
          dependencies: [
            new AwesomeModuleDependency(AwesomeModuleDependency.TYPE_NAME, 'module2', 'module2', true)
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
        this.amsm.fire('lib', m).then(
          function() {
            expect(module1lib.modules('module2')).to.be.null;
            this.mstore.set('module2', m2);
            this.amsm.fire('lib', m2).then(
              function() {
                expect(module1lib.modules('module2')).to.be.an('object');
                expect(module1lib.modules('module2')).to.have.property('itisthelib');
                expect(module1lib.modules('module2').itisthelib).to.be.true;
                done();
              }, done
            ).done();

          }.bind(this), done
        ).done();

      });
      it('should resolve the dependency by ability, when it is available', function(done) {
        var AwesomeModule = require('awesome-module');
        var AwesomeModuleDependency = AwesomeModule.AwesomeModuleDependency;
        var module1lib = {};
        var m = new AwesomeModule('module1', {
          lib: function(modules, callback) {
            module1lib.modules = modules;
            callback(null, module1lib);
          },
          dependencies: [
            new AwesomeModuleDependency(AwesomeModuleDependency.TYPE_ABILITY, 'ability1', 'ability1', true)
          ]
        });
        var m2 = new AwesomeModule('module2', {
          lib: function(modules, callback) {
            callback(null, {
              itisthelib: true
            });
          },
          abilities: ['ability1']
        });

        this.mstore.set('module1', m);
        this.amsm.fire('lib', m).then(
          function() {
            expect(module1lib.modules('ability1')).to.be.null;
            this.mstore.set('module2', m2);
            this.amsm.fire('lib', m2).then(
              function() {
                expect(module1lib.modules('ability1')).to.be.an('object');
                expect(module1lib.modules('ability1')).to.have.property('itisthelib');
                expect(module1lib.modules('ability1').itisthelib).to.be.true;
                done();
              }, done
            ).done();

          }.bind(this), done
        ).done();

      });

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
      }).done();
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
      }).done();
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
      }).done();
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
      this.amsm.fire('state2', m).done();
    });
  });

  describe('state context', function() {
    it('should be set to null in the "lib" state', function(done) {
      var AwesomeModule = require('awesome-module');
      var m = new AwesomeModule('module1', {
        lib: function(modules, callback) {
          expect(this).to.be.null;
          done();
        }
      });
      this.mstore.set('module1', m);
      this.amsm.fire('lib', m).done();
    });
    it('should be set to the module lib in any other state', function(done) {
      var AwesomeModule = require('awesome-module');
      var AwesomeState = require(libPath + '/state');
      var state1 = new AwesomeState('state1', ['lib']);
      this.amsm.stateStore.add(state1);
      var m = new AwesomeModule('module1', {
        lib: function(modules, callback) {
          callback(null, {
            iAmTheLib: true,
            iAmAMethod: function() {}
          });
        },
        state1: function(modules, callback) {
          expect(this.iAmTheLib).to.be.true;
          expect(this.iAmAMethod).to.be.a('function');
          done();
        }
      });
      this.mstore.set('module1', m);
      this.amsm.fire('state1', m).done();
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
      }, done).done();
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
      }, done).done();
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
  describe('states callbacks', function() {
    describe('dependencies by name', function() {
      beforeEach(function() {
        var steps = this.steps = [];
        var stateCallback = function(deps, callback) { steps.push('module2:callback'); callback(); };
        this.setStateCallback = function(cb) { stateCallback = cb; };
        var AwesomeModule = require('awesome-module'),
        AwesomeModuleDependency = AwesomeModule.AwesomeModuleDependency;
        var dependency = new AwesomeModuleDependency(AwesomeModuleDependency.TYPE_NAME, 'module1', 'module1', true);
        dependency.on('lib', function(deps, callback) { stateCallback.call(this, deps, callback); });
        this.m = new AwesomeModule('module1', {
          lib: function(modules, callback) { steps.push('module1:lib'); callback(null, {itisthelib: true}); }
        });
        this.m2 = new AwesomeModule('module2', {
          lib: function(modules, callback) { steps.push('module2:lib'); callback(null, {itisthelib2: true}); },
          dependencies: [dependency]
        });
      });
      describe('when dependency is loaded after the dependent', function() {
        it('should fire the state callback', function(done) {
          var self = this;
          var amsm = this.amsm;
          this.mstore.set('module1', this.m);
          this.mstore.set('module2', this.m2);
          amsm.fire('lib', self.m).then(function() {
            amsm.fire('lib', self.m2).then(function() {
              expect(self.steps).to.have.length(3);
              expect(self.steps.join(' ')).to.equal('module1:lib module2:lib module2:callback');
              done();
            },done).done();
          },done).done();
        });
        it('should have the correct "this" and dependency proxy', function(done) {
          var self = this;
          var amsm = this.amsm;
          this.mstore.set('module1', this.m);
          this.mstore.set('module2', this.m2);
          this.setStateCallback(function(deps, callback) {
            expect(this).to.have.property('itisthelib2');
            expect(deps('module1')).to.be.an('object');
            expect(deps('module1')).to.have.property('itisthelib');
            callback();
            done();
          });
          amsm.fire('lib', self.m).then(function() {
            amsm.fire('lib', self.m2).done();
          },done).done();
        });
      });
      describe('when dependency is loaded before the dependent', function() {
        it('should fire the state callback', function(done) {
          var self = this;
          var amsm = this.amsm;
          this.mstore.set('module1', self.m);
          this.mstore.set('module2', self.m2);
          amsm.fire('lib', self.m2).then(function() {
            amsm.fire('lib', self.m).then(function() {
              expect(self.steps).to.have.length(3);
              expect(self.steps.join(' ')).to.equal('module1:lib module2:lib module2:callback');
              done();
            },done).done();
          },done).done();
        });
        it('should have the correct "this" and dependency proxy', function(done) {
          var self = this;
          var amsm = this.amsm;
          this.mstore.set('module1', this.m);
          this.mstore.set('module2', this.m2);
          this.setStateCallback(function(deps, callback) {
            expect(this).to.have.property('itisthelib2');
            expect(deps('module1')).to.be.an('object');
            expect(deps('module1')).to.have.property('itisthelib');
            callback();
            done();
          });
          amsm.fire('lib', self.m2).then(function() {
            amsm.fire('lib', self.m).done();
          },done).done();
        });

      });
      describe('when dependency is known before the dependent', function() {
        it('should fire the state callback', function(done) {
          var self = this;
          var amsm = this.amsm;
          this.mstore.set('module2', self.m2);
          amsm.fire('lib', self.m2).then(function() {
            self.mstore.set('module1', self.m);
            amsm.fire('lib', self.m).then(function() {
              expect(self.steps).to.have.length(3);
              expect(self.steps.join(' ')).to.equal('module2:lib module1:lib module2:callback');
              done();
            },done).done();
          },done).done();
        });
        it('should have the correct "this" and dependency proxy', function(done) {
          var self = this;
          var amsm = this.amsm;
          this.setStateCallback(function(deps, callback) {
            expect(this).to.have.property('itisthelib2');
            expect(deps('module1')).to.be.an('object');
            expect(deps('module1')).to.have.property('itisthelib');
            callback();
            done();
          });
          this.mstore.set('module2', self.m2);
          amsm.fire('lib', self.m2).then(function() {
            self.mstore.set('module1', self.m);
            amsm.fire('lib', self.m).done();
          },done).done();
        });
      });
      describe('when dependency is known after the dependent', function() {
        it('should fire the state callback', function(done) {
          var self = this;
          var amsm = this.amsm;
          self.mstore.set('module1', self.m);
          amsm.fire('lib', self.m).then(function() {
            self.mstore.set('module2', self.m2);
            amsm.fire('lib', self.m2).then(function() {
              expect(self.steps).to.have.length(3);
              expect(self.steps.join(' ')).to.equal('module1:lib module2:lib module2:callback');
              done();
            },done).done();
          },done).done();
        });
        it('should have the correct "this" and dependency proxy', function(done) {
          var self = this;
          var amsm = this.amsm;
          this.setStateCallback(function(deps, callback) {
            expect(this).to.have.property('itisthelib2');
            expect(deps('module1')).to.be.an('object');
            expect(deps('module1')).to.have.property('itisthelib');
            callback();
            done();
          });
          self.mstore.set('module1', self.m);
          amsm.fire('lib', self.m).then(function() {
            self.mstore.set('module2', self.m2);
            amsm.fire('lib', self.m2).done();
          },done).done();
        });
      });
    });

    describe('dependencies by ability', function() {
      beforeEach(function() {
        var steps = this.steps = [];
        var stateCallback = function(deps, callback) { console.log('callback called'); steps.push('module2:callback'); callback(); };
        this.setStateCallback = function(cb) { stateCallback = cb; };
        var AwesomeModule = require('awesome-module'),
        AwesomeModuleDependency = AwesomeModule.AwesomeModuleDependency;
        var dependency = new AwesomeModuleDependency(AwesomeModuleDependency.TYPE_ABILITY, 'esn.ability1', 'ability1', true);
        dependency.on('lib', function(deps, callback) { stateCallback.call(this, deps, callback); });
        this.m = new AwesomeModule('module1', {
          lib: function(modules, callback) { steps.push('module1:lib'); callback(null, {itisthelib: true}); },
          abilities: ['esn.ability1']
        });
        this.m2 = new AwesomeModule('module2', {
          lib: function(modules, callback) { steps.push('module2:lib'); callback(null, {itisthelib2: true}); },
          dependencies: [dependency]
        });
      });
      describe('when dependency is loaded after the dependent', function() {
        it('should fire the state callback', function(done) {
          var self = this;
          var amsm = this.amsm;
          this.mstore.set('module1', this.m);
          this.mstore.set('module2', this.m2);
          amsm.fire('lib', self.m).then(function() {
            amsm.fire('lib', self.m2).then(function() {
              expect(self.steps).to.have.length(3);
              expect(self.steps.join(' ')).to.equal('module1:lib module2:lib module2:callback');
              done();
            },done).done();
          },done).done();
        });
        it('should have the correct "this" and dependency proxy', function(done) {
          var self = this;
          var amsm = this.amsm;
          this.mstore.set('module1', this.m);
          this.mstore.set('module2', this.m2);
          this.setStateCallback(function(deps, callback) {
            expect(this).to.have.property('itisthelib2');
            expect(deps('ability1')).to.be.an('object');
            expect(deps('ability1')).to.have.property('itisthelib');
            callback();
            done();
          });
          amsm.fire('lib', self.m).then(function() {
            amsm.fire('lib', self.m2).done();
          },done).done();
        });
      });
      describe('when dependency is loaded before the dependent', function() {
        it('should fire the state callback', function(done) {
          var self = this;
          var amsm = this.amsm;
          this.mstore.set('module1', self.m);
          this.mstore.set('module2', self.m2);
          amsm.fire('lib', self.m2).then(function() {
            amsm.fire('lib', self.m).then(function() {
              expect(self.steps).to.have.length(3);
              expect(self.steps.join(' ')).to.equal('module1:lib module2:lib module2:callback');
              done();
            },done).done();
          },done).done();
        });
        it('should have the correct "this" and dependency proxy', function(done) {
          var self = this;
          var amsm = this.amsm;
          this.mstore.set('module1', this.m);
          this.mstore.set('module2', this.m2);
          this.setStateCallback(function(deps, callback) {
            expect(this).to.have.property('itisthelib2');
            expect(deps('ability1')).to.be.an('object');
            expect(deps('ability1')).to.have.property('itisthelib');
            callback();
            done();
          });
          amsm.fire('lib', self.m2).then(function() {
            amsm.fire('lib', self.m).done();
          },done).done();
        });

      });
      describe('when dependency is known before the dependent', function() {
        it('should fire the state callback', function(done) {
          var self = this;
          var amsm = this.amsm;
          this.mstore.set('module2', self.m2);
          amsm.fire('lib', self.m2).then(function() {
            self.mstore.set('module1', self.m);
            amsm.fire('lib', self.m).then(function() {
              expect(self.steps).to.have.length(3);
              expect(self.steps.join(' ')).to.equal('module2:lib module1:lib module2:callback');
              done();
            },done).done();
          },done).done();
        });
        it('should have the correct "this" and dependency proxy', function(done) {
          var self = this;
          var amsm = this.amsm;
          this.setStateCallback(function(deps, callback) {
            expect(this).to.have.property('itisthelib2');
            expect(deps('ability1')).to.be.an('object');
            expect(deps('ability1')).to.have.property('itisthelib');
            callback();
            done();
          });
          this.mstore.set('module2', self.m2);
          amsm.fire('lib', self.m2).then(function() {
            self.mstore.set('module1', self.m);
            amsm.fire('lib', self.m).done();
          },done).done();
        });
      });
      describe('when dependency is known after the dependent', function() {
        it('should fire the state callback', function(done) {
          var self = this;
          var amsm = this.amsm;
          self.mstore.set('module1', self.m);
          amsm.fire('lib', self.m).then(function() {
            self.mstore.set('module2', self.m2);
            amsm.fire('lib', self.m2).then(function() {
              expect(self.steps).to.have.length(3);
              expect(self.steps.join(' ')).to.equal('module1:lib module2:lib module2:callback');
              done();
            },done).done();
          },done).done();
        });
        it('should have the correct "this" and dependency proxy', function(done) {
          var self = this;
          var amsm = this.amsm;
          this.setStateCallback(function(deps, callback) {
            expect(this).to.have.property('itisthelib2');
            expect(deps('ability1')).to.be.an('object');
            expect(deps('ability1')).to.have.property('itisthelib');
            callback();
            done();
          });
          self.mstore.set('module1', self.m);
          amsm.fire('lib', self.m).then(function() {
            self.mstore.set('module2', self.m2);
            amsm.fire('lib', self.m2).done();
          },done).done();
        });
      });
    });
  });
});
