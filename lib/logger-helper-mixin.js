'use strict';

function log_insane() {
  /*jshint validthis:true */
  if (process.env.DEBUG_INSANE) {
    this.logger.debug.apply(this.logger, arguments);
  }
}

module.exports = function(Obj) {
  Obj.prototype.log_insane = log_insane;
};
