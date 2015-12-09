var _ = require('lodash');
var assert = require('assert');
var util = require('util');
var events = require('events');

module.exports = function(acl, entity, key) {
  assert.ok(entity, 'entity required');
  key = key || 'id';

  var _acl = _.extend({}, acl, {
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
    }
  });

  return _acl;
};

function _filterAllowed(lock) {
  return (lock.key && lock.lock && (lock.read || lock.write || lock.remove));
}
