var _ = require('lodash');
var assert = require('assert');
var util = require('util');

var toString = require('./logic/string');
var toJSON = require('./logic/json');
var toFn = require('./logic/fn');

module.exports = function(acl, entity, key) {
  assert.ok(entity, 'entity required');
  key = key || 'id';

  var Acl = {};
  var opts = { entity: entity, key: key, acl: Acl };

  _.extend(Acl, acl, {
    parent: acl,
    locks: function(ent, done) {

      acl.locks(ent, function(err, locks) {
        var _locks = _(locks)
          .map(_defaults)
          .filter(_filterAllowed)
          .value();

        done(null, _locks);

        function _defaults(lock) {
          return _.defaults({}, lock, {
            entityId: ent.id,
            entity: entity,
            read: false,
            write: false,
            remove: false
          });
        }
      });

    },
    toString: function() {
      return toString(opts, acl.conditions)();
    },
    toJSON: function() {
      return toJSON(opts, acl.conditions)();
    },
    access: function(user, ent, action, done) {
      toFn(opts, acl.conditions)(user, ent, action, done);
    },
    filter: function(user, ent, action, done) {
        
    }
  });

  return Acl;
};

function _filterAllowed(lock) {
  return (lock.key && lock.lock && (lock.read || lock.write || lock.remove));
}
