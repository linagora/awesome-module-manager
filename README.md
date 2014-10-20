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
});

// then register the module.
manager.registerModule(mongoModule);
// and finally fire the datastore_connect state !
manager.fire('datastore_connect', 'datastore.mongo');

```

### dependencies

Now, let's say we want the mongodb connection string to come from our configuration system.
We have to create a configuration module, and add a dependency of the mongo module to the config module.

```javascript
var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;
var AwesomeModuleManager = require('awesome-module-manager');
var manager = new AwesomeModuleManager();
manager.registerState('datastore_connect', ['lib']);

// create the configuration module
var configModule = new AwesomeModule('basic.config', {
  lib: function(dependencies, callback) {
    var api = require('../../config.json');
    return callback(null, api);
  }
});

var mongoModule = new AwesomeModule('datastore.mongo', {
  dependencies: [
    // tell the system we depends on basic.config
    // and we want it aliased as "conf"
    new Dependency(Dependency.TYPE_NAME, 'basic.config', 'conf')
  ],
  lib: function(dependencies, callback) {
    var api = { connected: false };
    return callback(null, api);
  },
  datastore_connect: function(dependencies, callback) {
    var self = this;
    // dependencies contains the dependencies we require
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
});

// then register the module.
manager.registerModule(mongoModule);
// and finally fire the datastore_connect state !
manager.fire('datastore_connect', 'datastore.mongo');

```

### dependencies niceties

#### optionnal dependencies

A module can optionnaly require a dependency

    new Dependency(Dependency.TYPE_NAME, 'basic.config', 'conf', false)

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

## Module loaders

You can teach the module manager new ways to load modules. Right now it provides two methods:

* the code loader

This is what we did in the previous example. We create the Awesome module and inject it programatically.

* the filesystem loader

This loader lookup the modules in a given path. The module name should correspond with the folder name inside of the path.
A require(path/modulename) shoudl return an AwesomeModule.

```javascript
var AwesomeModuleManager = require('awesome-module-manager');
mm = new AwesomeModuleManager();
var fsLoader1 = mm.loaders.filesystem('/some/path');
mm.registerLoader(fsLoader1);


mm.fire('test.module', 'lib');
// the module manager will check if there is a "test.module" folder inside /some/path.
// if found, it will try : var module = require('/some/path/test.module');
// and then check that module is an awesome module
```

The module manager loaders are middleware : they are called in order, until one of them find the module.
