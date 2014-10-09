'use strict';

function consoleLogger() {
  console.log.apply(console, arguments);
}

function AwesomeConsoleLogger() {
}

AwesomeConsoleLogger.prototype.info = consoleLogger;
AwesomeConsoleLogger.prototype.warn = consoleLogger;
AwesomeConsoleLogger.prototype.error = consoleLogger;
AwesomeConsoleLogger.prototype.success = consoleLogger;
AwesomeConsoleLogger.prototype.debug = consoleLogger;

module.exports = AwesomeConsoleLogger;
