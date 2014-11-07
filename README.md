# Awesome Module Manager

This is a way to help achieve modularity in large NodeJS applications.

## What is the problem ?

Generally you start a NodeJS project. And it becomes big. So you split it using NPM.
However, NPM manages dependencies at the code level, but not at the application level.
A complex and modular (web) application needs to provide lots of facilities:

- open connections to the different data stores
- register HTTP resources (assets, javascript, REST endpoints)
- register subscribers on an event emitter, because of, you know, lazy coupling
- ...

And maybe you will need, later, to replace a module by another, so you'll use dependency injection of some kind.

The Awsesome Module Manager aims to facilitate the organization of those kind of lerge apps. It falls into the same kind of software than [The Architect](https://github.com/c9/architect).

## How does it work

### basics

You define states in your applications. You define the actions that the module should do in this state.


```javascript
var mongo = require('mongodb')
var AwesomeModule = require('awesome-module');
var AwesomeModuleManager = require('awesome-module-manager');

var manager = new AwesomeModuleManager();
// create the datastore_connect state: all states depend of the
// lib state, but we specify it anyway
manager.registerState('datastore_connect', ['lib']);

//create a module
var mongoModule = new AwesomeModule('datastore.mongo', {
  states: {
    // the "lib" state is always defined: it is where your module should
    // expose its API: it's the equivalent of var lib = require('themodule');
    lib: function(dependencies, callback) {
      var api = { connected: false };
      return callback(null, api);
    },
    datastore_connect: function(dependencies, callback) {
      // "this" is the api object returned in the lib state
      var self = this;
      mongo.MongoClient.connect(
        "mongodb://localhost:27017/integration_tests",
        function(err, db) {
          if ( err ) { return callback(err); }
          self.db = db;
          self.connected = true;
          callback();
      });
    }
  }
});

// then register the module.
manager.registerModule(mongoModule);
// and finally fire the datastore_connect state !
manager.fire('datastore_connect', 'datastore.mongo');

```

### dependencies

Now, let's say we want the mongodb connection string to come from our configuration system.
We have to create a configuration module, and add a dependency of the mongo module to the config module.

Lib is a special state: the result of the lib state id what will be given to the requester module.

```javascript
var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;
var AwesomeModuleManager = require('awesome-module-manager');
var manager = new AwesomeModuleManager();
manager.registerState('datastore_connect', ['lib']);

// create the configuration module
var configModule = new AwesomeModule('basic.config', {
  states: {
    lib: function(dependencies, callback) {
      var api = require('../../config.json');
      // Here we return the api object. This is the object that
      // will be given to dependent modules
      return callback(null, api);
    }
  }
});

var mongoModule = new AwesomeModule('datastore.mongo', {
  dependencies: [
    // tell the system we depends on basic.config
    // and we want it aliased as "conf"
    new Dependency(Dependency.TYPE_NAME, 'basic.config', 'conf')
  ],
  states: {
    lib: function(dependencies, callback) {
      var api = { connected: false };
      return callback(null, api);
    },
    datastore_connect: function(dependencies, callback) {
      var self = this;
      // dependencies contains the dependencies we require
      // here config will contain the "api" object exported in the lib state
      // of the "basic.config" module.
      var config = dependencies('conf');
      mongo.MongoClient.connect(
        config.mongoUrl,
        function(err, db) {
          if ( err ) { return callback(err); }
          self.db = db;
          self.connected = true;
          callback();
      });
    }
  }
});

// then register the module.
manager.registerModule(mongoModule);
// and finally fire the datastore_connect state !
manager.fire('datastore_connect', 'datastore.mongo');

```

### dependencies niceties

#### optional dependencies

A module can optionally require a dependency

    new Dependency(Dependency.TYPE_NAME, 'basic.config', 'conf', true)

The injected dependencies('conf') may or may not contain the conf object.

#### dependencies by ability

Sometimes you don't want to express a dependency by it's name, but for the API it provides.
For example, you may want a logger, and don't care that it's winston or another implementation.

Modules can tell the abilities they provide:

```javascript
var someModule = new AwesomeModule('some.name', {
  abilities: ['interface.logger'],
  ...
});
```
And modules can express a dependency upon an ability :

```javascript
var otherModule = new AwesomeModule('other.name', {
  dependencies: [
    new Dependency(Dependency.TYPE_ABILITY, 'interface.logger', 'myLogger')
  ],
  ...
});
```

### Dependency callback

A module can sepcify that it wants a callback to be fired when a dependency is fulfilled and both the module and its dependency reach a certain state.

```javascript
var AMD = AwesomeModule.AwesomeModuleDependency;
var exampleModule = new AwesomeModule('example', {
  states: {
    lib: function(dependencies, callback) {
      console.log('example module lib');
      return callback(null, {foo: function(){}});
    }
    start: function(dependencies, callback) {
      console.log('example module start');
      return callback();
    }
  }
});

var dependency = new AMD(AMD.TYPE_NAME, 'example', 'example', true);
dependency.on('start', function(deps, callback){
  console.log('dependent module start callback');
  deps('example').foo();
});

var dependentModule = new AwesomeModule('dependent', {
  states: {
    lib: function(dependencies, callback) {
      console.log('dependent module lib')
      return callback(null, {bar: function(){}});
    },
    start: function(dependencies, callback) {
      console.log('dependent module start')
      return callback();
    }
  },
  dependencies: [dependency]
});

var manager = new AwesomeModuleManager();
manager.registerState('start', ['lib']);


manager.registerModule(exampleModule);
manager.fire('start', 'example');
manager.registerModule(dependentModule);
manager.fire('start', 'dependant');
```

will echo

```
example module lib
example module start
dependent module lib
dependent module start
dependent module start callback
```

Now, the same code, but with a different loading order, will also work:
```javascript
var manager = new AwesomeModuleManager();
manager.registerState('start', ['lib']);

manager.registerModule(dependentModule);
manager.fire('start', 'dependant');
manager.registerModule(exampleModule);
manager.fire('start', 'example');
```

will echo

```
dependent module lib
dependent module start
example module lib
example module start
dependent module start callback
```


## Module loaders

### basics

You can teach the module manager new ways to load modules. Right now it provides two methods:

* the code loader

Here we create the exampleModule programmatically, and then register a code loader for it.
This is basically what the AwesomeModuleManager registerModule does under the hood.

```javascript
var AwesomeModuleManager = require('awesome-module-manager');
var exampleModule = new AwesomeModule('example.module');

mm = new AwesomeModuleManager();
var codeLoader1 = mm.loaders.code(exampleModule);
mm.registerLoader(codeLoader1);

mm.fire('lib', 'example.module');
```

* the filesystem loader

This loader lookup the modules in a given path. The module name should correspond with the folder name inside of the path.
A require(path/modulename) shoudl return an AwesomeModule.

```javascript
var AwesomeModuleManager = require('awesome-module-manager');
mm = new AwesomeModuleManager();
var fsLoader1 = mm.loaders.filesystem('/some/path');
mm.registerLoader(fsLoader1);

mm.fire('lib, ''test.module');
// the module manager will check if there is a "test.module" folder inside /some/path.
// if found, it will try : var module = require('/some/path/test.module');
// and then check that module is an awesome module
```

The module manager loaders are middleware : they are called in order, until one of them find the module.

### trusted and untrusted loaders

In such a system, maybe you'll have to load one day third party modules. The loader API allows you to flag a loader as being trusted or untrusted.
This information will be propagated when a module requires another module (see Module API proxy section below).

Be default, loaders are configured as untrusted.

```javascript
var AwesomeModuleManager = require('awesome-module-manager');
mm = new AwesomeModuleManager();

// create an untrusted loader. All modules loaded through it (so, that are found under /some/path) will be flagged as untrusted.
var fsLoader1 = mm.loaders.filesystem('/some/path');
mm.registerLoader(fsLoader1);

// create a trusted loader. All modules loaded through it will be flagged as trusted.
var fsLoader2 = mm.loaders.filesystem('/my/modules', true);
mm.registerLoader(fsLoader2);
```


## Module API proxy

### Basics

You can adapt the API presented to the requesting module by adding a proxy method to the module.

```javascript
var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;
var AwesomeModuleManager = require('awesome-module-manager');
var manager = new AwesomeModuleManager();
manager.registerState('lib');

// this module will export different API, depending on the requester
var configModule = new AwesomeModule('basic.config', {
  states: {
    lib: function(dependencies, callback) {
      var api = {
        color: 'blue'
      }
      return callback(null, api);
    }
  },
  proxy: function(requesterName, trusted) {
    if (requesterName === 'basic.sun') {
      return {
        color: 'yellow';
      }
    } else {
      return this;
    }
  }
});

var skyModule = new AwesomeModule('basic.sky', {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'basic.config', 'conf')
  ],
  states: {
    lib: function(dependencies, callback) {
      var conf = dependencies('conf');
      console.log('in basic.sky module, conf color = ' + conf.color); //in basic.sky module, conf color = blue
      return callback(null, {});
    }
  }
});

var sunModule = new AwesomeModule('basic.sun', {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'basic.config', 'conf')
  ],
  states: {
    lib: function(dependencies, callback) {
      var conf = dependencies('conf');
      console.log('in basic.sun module, conf color = ' + conf.color); //in basic.sun module, conf color = yellow
      return callback(null, {});
    }
  }
});

manager.registerModule(skyModule);
manager.registerModule(sunModule);
// and finally fire the datastore_connect state !
manager.fire('lib', ['basic.sky', 'basic.sun']);
```

### Use with trusted & untrusted loaders
The main interest of this feature is to be able to present a distinct API when a module is trusted, or untrusted.

```javascript
var AwesomeModuleManager = require('awesome-module-manager');
var exampleModule = new AwesomeModule('example.module', {
  states: {
    lib: function(deps, callback) {
      var conf = deps('conf');
      conf.doSomethingTricky(); // will echo "I do not beliave you" because the associated loader codeLoader1 is untrusted
    }
  },
  dependencies: [ new Dependency(Dependency.TYPE_NAME, 'basic.config', 'conf') ]
});

var exampleModule2 = new AwesomeModule('example.module2', {
  states: {
    lib: function(deps, callback) {
      var conf = deps('conf');
      conf.doSomethingTricky(); // will echo "doing something tricky..." because the associated loader codeLoader2 is trusted
    }
  },
  dependencies: [ new Dependency(Dependency.TYPE_NAME, 'basic.config', 'conf') ]
});

var configModule = new AwesomeModule('basic.config', {
  states: {
    lib: function(dependencies, callback) {
      var api = {
        doSomethingTricky: function() { console.log('doing something tricky...'); }
      };
      return callback(null, api);
    }
  },
  proxy: function(requesterName, trusted) {
    if (!trusted) {
      return {
        doSomethingTricky: function() { console.log('I do not believe you !!!'); }
      };
    } else {
      return this;
    }
  }
});


mm = new AwesomeModuleManager();
var codeLoader1 = mm.loaders.code(exampleModule);
mm.registerLoader(codeLoader1);
var codeLoader2 = mm.loaders.code(exampleModule2);
mm.registerLoader(codeLoader2, true);
var confLoader = mm.loaders.code(configModule);
mm.registerLoader(confLoader);

mm.fire('lib', ['example.module', 'example.module2']);
```



## events

An AwesomeModuleManager is also an event emitter.

Here is the list of emitted events:

| Event  | Associated data  | Description  |
|---|---|---|
|  loader:loadstart | name: the module name, context: the module loading context  | fired when the manager starts the loading process for a module |
| loader: loaderror  | name: the module name, module: the module object, context: the module loading context, error: the error  |  fired when the manager encountered an error while trying to load a module |
| loader:loaded  | name: the module name, module: the module object, context: the module loading context  | fired when a module finished loading successfully  |
| state:fire  | state: the state name, module: the module object | fired when launching a certain state on a module  |
| state:fulfilled  | state: the state name, module: the module object | fired when a certain state has been successfully reached on a module  |
| state:failed  | state: the state name, module: the module object, error: the error object | fired when a certain state failed to complete, either because of a direct error thrown, or because the module returns an error object |
